
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";

type MessageParams = {
  from: string;
  contactName: string;
  messageId: string;
  messageBody: string;
  phoneNumberId: string;
  userId: string; // Added userId parameter
};

export async function processMessage(
  supabase: SupabaseClient<Database>,
  params: MessageParams
) {
  const { from, contactName, messageId, messageBody, phoneNumberId, userId } = params;

  console.log(`Processing message from ${contactName} (${from}): ${messageBody}`);

  // First, check if we already have a conversation with this contact
  const { data: existingConversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("contact_number", from)
    .eq("user_id", userId) // Filter by user_id
    .maybeSingle();

  if (conversationError) {
    console.error("Error checking for existing conversation:", conversationError);
    throw conversationError;
  }

  let conversationId;

  if (existingConversation) {
    // Use the existing conversation
    conversationId = existingConversation.id;
    console.log(`Using existing conversation: ${conversationId}`);
  } else {
    // Create a new conversation
    const { data: newConversation, error: newConversationError } = await supabase
      .from("conversations")
      .insert({
        contact_number: from,
        contact_name: contactName,
        platform: "whatsapp",
        ai_enabled: true,
        user_id: userId, // Set the user_id for new conversations
      })
      .select("id")
      .single();

    if (newConversationError) {
      console.error("Error creating new conversation:", newConversationError);
      throw newConversationError;
    }

    conversationId = newConversation.id;
    console.log(`Created new conversation: ${conversationId}`);
  }

  // Store the message
  const { data: insertedMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      content: messageBody,
      status: "received",
      whatsapp_message_id: messageId,
      sender_number: from,
      sender_name: contactName,
      user_id: userId, // Set the user_id for messages
    })
    .select("id")
    .single();

  if (messageError) {
    console.error("Error storing message:", messageError);
    throw messageError;
  }

  console.log(`Stored message with ID: ${insertedMessage.id}`);

  return {
    conversationId,
    dbMessageId: insertedMessage.id,
  };
}
