
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";
import { MessagingParams, sendWhatsAppMessage } from "../whatsapp.ts";
import { createNewTicket } from "../automatedTicketService.ts";
import { Intent } from "../types/intent.ts";
import { getAISettings } from "../ai-settings.ts";
import { generateAIResponse } from "../services/response-processor.ts";
import { fetchKnowledgeBaseMatches } from "../services/knowledge-base.ts";
import { processOrderIntent } from "../services/order-processor.ts";

// Process the detected intent
export async function handleIntent(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  messageId: string,
  messageContent: string,
  senderNumber: string,
  senderName: string,
  messagingParams: MessagingParams,
  userId: string // Added userId parameter
) {
  try {
    // Get AI settings for this user
    const aiSettings = await getAISettings(supabase, userId);

    // Simple intent detection (can be replaced with more sophisticated logic)
    const intent = detectIntent(messageContent);
    console.log(`Detected intent: ${intent} for message: "${messageContent}"`);

    // Process based on intent
    switch (intent) {
      case "order":
        await processOrderIntent(
          supabase,
          conversationId,
          messageId,
          messageContent,
          senderNumber,
          senderName,
          messagingParams,
          userId
        );
        break;

      case "support":
        // Create a support ticket
        await createNewTicket(
          supabase,
          {
            platform: "whatsapp",
            type: "Support",
            title: `Support request from ${senderName}`,
            body: messageContent,
            customer_name: senderName,
            status: "New",
            priority: "HIGH",
            context: `Conversation ID: ${conversationId}`,
            whatsapp_message_id: messageId,
          },
          userId // Pass userId to ensure the ticket is created for the correct user
        );

        // Send acknowledgment
        await sendWhatsAppMessage(
          messagingParams,
          senderNumber,
          "Thank you for your support request. Our team will get back to you shortly."
        );
        break;

      default:
        // For general inquiries, use AI to generate a response
        const knowledgeMatches = await fetchKnowledgeBaseMatches(
          supabase,
          messageContent,
          userId // Pass userId to filter knowledge base by user
        );

        const aiResponse = await generateAIResponse(
          supabase,
          conversationId,
          messageContent,
          knowledgeMatches,
          aiSettings,
          userId // Pass userId for context
        );

        // Send the AI-generated response
        await sendWhatsAppMessage(messagingParams, senderNumber, aiResponse);

        // Store the AI response in the database
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          content: aiResponse,
          status: "sent",
          sender_number: messagingParams.phoneNumberId,
          sender_name: "AI Assistant",
          user_id: userId, // Set the user_id for the AI response message
        });
    }
  } catch (error) {
    console.error("Error handling intent:", error);
    // Log the error to the database
    await supabase.from("system_logs").insert({
      component: "intent-processor",
      log_level: "ERROR",
      message: `Error handling intent: ${error.message}`,
      metadata: { error: error.toString() },
    });

    // Try to send an error message to the user
    try {
      await sendWhatsAppMessage(
        messagingParams,
        senderNumber,
        "I'm sorry, but I encountered an error processing your request. Please try again later."
      );
    } catch (sendError) {
      console.error("Error sending error message:", sendError);
    }
  }
}

// Simple intent detection function (can be expanded)
function detectIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("buy") ||
    lowerMessage.includes("order") ||
    lowerMessage.includes("purchase") ||
    lowerMessage.includes("product")
  ) {
    return "order";
  } else if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("support") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("problem")
  ) {
    return "support";
  }

  return "general";
}
