
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../../_shared/database.types.ts";
import { sendWhatsAppMessage } from "../whatsapp.ts";
import { callGemini } from "../ai-models/gemini.ts";
import { callOllama } from "../ai-models/ollama.ts";
import { AISettingsType } from "../types/ai-settings.ts";
import { IntentResult } from "../types/intent.ts";
import { formatAIResponse } from "../utils/aiResponseFormatter.ts";
import { confirmOrder } from "./order-processor.ts";
import { createTicket } from "./ticket-handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function processResponse(
  messageText: string,
  contactPhone: string,
  contactName: string,
  intentResult: IntentResult,
  knowledgeContext: any[],
  userId: string,
  phoneNumberId: string,
  aiSettings: AISettingsType
) {
  try {
    // Check if this is an order confirmation
    if (
      messageText.toLowerCase() === "yes" ||
      messageText.toLowerCase() === "ow" ||
      messageText === "ඔව්"
    ) {
      // Check for pending order
      const { data: pendingOrder } = await supabase
        .from("pending_orders")
        .select("*")
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("status", "pending_confirmation")
        .order("created_at", { ascending: false })
        .limit(1);

      if (pendingOrder && pendingOrder.length > 0) {
        await confirmOrder(contactPhone, userId, phoneNumberId);
        return;
      }
      // If no pending order, continue with normal processing
    }

    // Determine if human escalation is needed
    const needsHumanEscalation = determineIfNeedsHumanEscalation(
      intentResult,
      messageText
    );

    if (needsHumanEscalation) {
      // Create a support ticket
      await createTicket(
        messageText,
        contactPhone,
        contactName,
        intentResult,
        userId
      );

      // Send acknowledgment to the user
      await sendWhatsAppMessage(
        contactPhone,
        "Thank you for your message. I've created a ticket for our support team, and they will get back to you shortly.",
        phoneNumberId
      );
      return;
    }

    // Prepare conversation context
    const conversationContext = await getConversationContext(
      contactPhone,
      userId,
      aiSettings.context_memory
    );

    // Combine knowledge base context and conversation context
    const combinedContext = prepareCombinedContext(
      knowledgeContext,
      conversationContext
    );

    // Prepare the user-specific AI prompt
    const prompt = preparePrompt(
      messageText,
      combinedContext,
      intentResult,
      aiSettings
    );

    // Get AI response based on the configured model
    let aiResponse;
    switch (aiSettings.model) {
      case "gemini-pro":
        aiResponse = await callGemini(prompt);
        break;
      case "ollama":
        aiResponse = await callOllama(prompt);
        break;
      default:
        aiResponse = await callGemini(prompt);
    }

    // Format the response
    const formattedResponse = formatAIResponse(aiResponse, aiSettings.tone);

    // Store the conversation in the database
    await storeConversation(
      messageText,
      formattedResponse,
      contactPhone,
      contactName,
      userId
    );

    // Send the response to the user
    await sendWhatsAppMessage(contactPhone, formattedResponse, phoneNumberId);
  } catch (error) {
    console.error("Error processing response:", error);
    // Send a fallback message
    await sendWhatsAppMessage(
      contactPhone,
      "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      phoneNumberId
    );
  }
}

// Helper function to determine if human escalation is needed
function determineIfNeedsHumanEscalation(
  intentResult: IntentResult,
  messageText: string
): boolean {
  // Complex inquiries that might need human attention
  const needsHuman =
    intentResult.intent === "COMPLEX_INQUIRY" ||
    intentResult.intent === "COMPLAINT" ||
    messageText.toLowerCase().includes("speak to a human") ||
    messageText.toLowerCase().includes("talk to agent") ||
    messageText.toLowerCase().includes("speak to agent") ||
    messageText.toLowerCase().includes("speak to support");

  return needsHuman;
}

// Get recent conversation context
async function getConversationContext(
  contactPhone: string,
  userId: string,
  contextMemory: string
): Promise<string> {
  try {
    // Define the time window based on context memory setting
    let timeWindow;
    switch (contextMemory) {
      case "short":
        timeWindow = "30 minutes";
        break;
      case "medium":
        timeWindow = "6 hours";
        break;
      case "long":
        timeWindow = "24 hours";
        break;
      case "recent":
      default:
        timeWindow = "2 hours";
    }

    // Get recent messages for this user and contact
    const { data: messages, error } = await supabase
      .from("message_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("contact_phone", contactPhone)
      .gt("created_at", `now() - interval '${timeWindow}'`)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error || !messages || messages.length === 0) {
      return "";
    }

    // Format the conversation context
    return messages
      .map(
        (msg) =>
          `${
            msg.is_from_user ? "User" : "Assistant"
          }: ${msg.message}`
      )
      .join("\n");
  } catch (error) {
    console.error("Error getting conversation context:", error);
    return "";
  }
}

// Prepare combined context from knowledge base and conversation
function prepareCombinedContext(
  knowledgeContext: any[],
  conversationContext: string
): string {
  let context = "";

  // Add knowledge base context if available
  if (knowledgeContext && knowledgeContext.length > 0) {
    context += "Relevant information from the knowledge base:\n";
    knowledgeContext.forEach((item) => {
      context += `- ${item.content}\n`;
      if (item.source === "product" && item.metadata) {
        context += `  Price: ${item.metadata.price}\n`;
        if (item.metadata.discounts) {
          context += `  Discounts: ${item.metadata.discounts}\n`;
        }
      }
    });
    context += "\n";
  }

  // Add conversation context if available
  if (conversationContext) {
    context += "Recent conversation:\n";
    context += conversationContext;
    context += "\n\n";
  }

  return context;
}

// Prepare the AI prompt
function preparePrompt(
  userMessage: string,
  context: string,
  intentResult: IntentResult,
  aiSettings: AISettingsType
): string {
  let prompt = aiSettings.behavior + "\n\n";

  if (context) {
    prompt += context + "\n";
  }

  prompt += `Intent detected: ${intentResult.intent}\n\n`;
  prompt += `User: ${userMessage}\n\n`;
  prompt += "Assistant: ";

  return prompt;
}

// Store the conversation in the database
async function storeConversation(
  userMessage: string,
  aiResponse: string,
  contactPhone: string,
  contactName: string,
  userId: string
) {
  try {
    // Check if there's an existing conversation
    const { data: existingConvo, error: convoError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "whatsapp")
      .eq("contact_phone", contactPhone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    let conversationId;

    if (convoError || !existingConvo) {
      // Create a new conversation
      const { data: newConvo, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          platform: "whatsapp",
          contact_name: contactName,
          contact_phone: contactPhone,
          ai_enabled: true,
        })
        .select()
        .single();

      if (createError || !newConvo) {
        console.error("Error creating conversation:", createError);
        return;
      }

      conversationId = newConvo.id;
    } else {
      conversationId = existingConvo.id;

      // Update the conversation's updated_at timestamp
      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
          contact_name: contactName, // Update in case it changed
        })
        .eq("id", conversationId);
    }

    // Store user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      content: userMessage,
      role: "user",
      sender_name: contactName,
    });

    // Store AI response
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      content: aiResponse,
      role: "assistant",
      sender_name: "AI Assistant",
    });
  } catch (error) {
    console.error("Error storing conversation:", error);
  }
}
