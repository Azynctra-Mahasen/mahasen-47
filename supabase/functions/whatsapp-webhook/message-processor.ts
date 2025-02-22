
import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const processWhatsAppMessage = async (
  messageId: string,
  userMessage: string,
  userId: string,
  userName: string,
  phoneId: string,
  accessToken: string
) => {
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Store the message in the database
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        whatsapp_message_id: messageId,
        content: userMessage,
        sender_name: userName,
        sender_number: userId,
        status: 'received'
      })
      .select()
      .single();

    if (messageError) throw messageError;

    console.log('Message stored:', messageData);

    return { success: true };
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
};

export const findReceiverProfile = async (
  supabase: SupabaseClient,
  displayPhoneNumber: string
) => {
  // Remove any spaces and ensure number format is consistent
  const formattedNumber = displayPhoneNumber.startsWith('+') 
    ? displayPhoneNumber 
    : `+${displayPhoneNumber}`;

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
