
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../_shared/database.types.ts";
import { processIntent } from "./services/intent-processor.ts";
import { processResponse } from "./services/response-processor.ts";
import { getAISettings } from "./ai-settings.ts";
import { getKnowledgeBaseContext } from "./services/knowledge-base.ts";
import { processOrderIntent } from "./services/order-processor.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function processMessage(body: any, userId: string, phoneNumberId: string) {
  try {
    // Extract the WhatsApp message data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];

    // Process each message in the payload
    for (const message of messages) {
      if (message.type !== "text") {
        console.log(`Unsupported message type: ${message.type}`);
        continue;
      }

      const contactName = value?.contacts?.[0]?.profile?.name || "Unknown User";
      const contactPhone = message.from;
      const messageText = message.text?.body || "";
      const messageId = message.id;
      const timestamp = message.timestamp;

      console.log(`Received message from ${contactName} (${contactPhone}): ${messageText}`);

      // Get user-specific AI settings
      const aiSettings = await getAISettings(userId);
      
      // Identify intent based on the message
      const intentResult = await processIntent(messageText, userId);
      
      console.log(`Detected intent: ${intentResult.intent}`);
      
      // Handle Order intent specially
      if (intentResult.intent === "ORDER") {
        await processOrderIntent(messageText, contactPhone, contactName, userId, phoneNumberId);
        continue;
      }

      // Get relevant knowledge base context based on the message for the specific user
      const knowledgeContext = await getKnowledgeBaseContext(messageText, userId);

      // Process the response based on intent and context
      await processResponse(
        messageText,
        contactPhone,
        contactName,
        intentResult,
        knowledgeContext,
        userId,
        phoneNumberId,
        aiSettings
      );

      // Log the message in the database
      await supabase.from("message_logs").insert({
        user_id: userId,
        contact_phone: contactPhone,
        contact_name: contactName,
        message: messageText,
        intent: intentResult.intent,
        platform: "whatsapp",
        external_message_id: messageId,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    throw error;
  }
}
