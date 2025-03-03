
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";

interface MessageData {
  from: string;
  contactName: string;
  messageId: string;
  messageBody: string;
  phoneNumberId: string;
  userId: string;
}

export async function processMessage(
  supabase: ReturnType<typeof createClient<Database>>,
  messageData: MessageData
) {
  const { from, contactName, messageId, messageBody, phoneNumberId, userId } = messageData;

  try {
    console.log(`Processing message from ${from} (${contactName}): ${messageBody}`);

    // Find or create conversation
    let conversationId: string;
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", from)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log(`Using existing conversation: ${conversationId}`);

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      console.log(`Creating new conversation for ${from} (${contactName})`);
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          contact_number: from,
          contact_name: contactName,
          platform: "whatsapp",
          user_id: userId
        })
        .select("id")
        .single();

      if (conversationError || !newConversation) {
        throw new Error(`Error creating conversation: ${conversationError?.message || "Unknown error"}`);
      }

      conversationId = newConversation.id;
      console.log(`Created new conversation: ${conversationId}`);
    }

    // Save message to database
    console.log(`Saving message to database for conversation ${conversationId}`);
    const { data: dbMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        content: messageBody,
        conversation_id: conversationId,
        sender_name: contactName,
        sender_number: from,
        status: "received",
        whatsapp_message_id: messageId,
        user_id: userId
      })
      .select("id")
      .single();

    if (messageError || !dbMessage) {
      throw new Error(`Error saving message: ${messageError?.message || "Unknown error"}`);
    }

    console.log(`Message saved with ID: ${dbMessage.id}`);
    return { conversationId, dbMessageId: dbMessage.id };
  } catch (error) {
    console.error("Error processing message:", error);
    throw error;
  }
}
