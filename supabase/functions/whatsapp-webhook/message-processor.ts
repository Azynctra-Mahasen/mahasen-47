
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function processWhatsAppMessage(
  messageId: string,
  message: string,
  userId: string,
  userName: string,
  phoneId: string,
  accessToken: string
) {
  console.log('Starting message processing:', { messageId, userId, userName });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for existing conversation...');

    // Check if conversation exists
    const { data: existingConversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .single();

    if (conversationError) {
      console.error('Error checking conversation:', conversationError);
      throw conversationError;
    }

    let conversationId;
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      conversationId = existingConversation.id;
    } else {
      console.log('Creating new conversation...');
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          contact_name: userName,
          contact_number: userId,
          platform: 'whatsapp',
          ai_enabled: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }
      console.log('Created new conversation:', newConversation.id);
      conversationId = newConversation.id;
    }

    console.log('Saving message to database...');
    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: message,
        status: 'received',
        sender_name: userName,
        sender_number: userId,
        read: false
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw messageError;
    }

    console.log('Message processed and saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in processWhatsAppMessage:', error);
    throw error;
  }
}
