
import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const processWhatsAppMessage = async (
  messageId: string,
  userMessage: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverNumber: string
) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Create a new conversation or get existing one
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', senderId)
      .eq('platform', 'whatsapp')
      .single();

    let conversationId;
    
    if (conversationError) {
      // Create new conversation
      const { data: newConversation, error: newConversationError } = await supabase
        .from('conversations')
        .insert({
          contact_number: senderId,
          contact_name: senderName,
          platform: 'whatsapp',
          ai_enabled: true
        })
        .select()
        .single();

      if (newConversationError) throw newConversationError;
      conversationId = newConversation.id;
    } else {
      conversationId = conversation.id;
    }

    // Store the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        whatsapp_message_id: messageId,
        content: userMessage,
        sender_name: senderName,
        sender_number: senderId,
        status: 'received',
        conversation_id: conversationId
      })
      .select()
      .single();

    if (messageError) throw messageError;

    console.log('Message stored:', messageData);
    return { success: true, conversationId };
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
};

export const findReceiverProfile = async (
  supabase: SupabaseClient,
  displayPhoneNumber: string
) => {
  // Format the phone number consistently
  const formattedNumber = displayPhoneNumber.startsWith('+') 
    ? displayPhoneNumber 
    : `+${displayPhoneNumber}`;

  console.log('Looking for receiver profile with number:', formattedNumber);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, whatsapp_number')
    .eq('whatsapp_number', formattedNumber)
    .single();

  if (error) {
    console.error(`No user found for WhatsApp number: ${formattedNumber}`);
    throw new Error(`No user found for WhatsApp number: ${formattedNumber}`);
  }

  return profile;
};
