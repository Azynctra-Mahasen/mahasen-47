
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function storeConversation(
  supabase: any,
  userId: string,
  userName: string,
  message: string,
  platform: 'whatsapp' | 'facebook' | 'instagram'
): Promise<string> {
  try {
    // Check for existing conversation
    const { data: existingConv, error: queryError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError;
    }

    if (existingConv) {
      return existingConv.id;
    }

    // Create new conversation if none exists
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert({
        contact_number: userId,
        contact_name: userName,
        platform: platform,
        ai_enabled: true // Default to AI enabled
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return newConv.id;
  } catch (error) {
    console.error('Error in storeConversation:', error);
    throw error;
  }
}

export async function storeAIResponse(
  supabase: any,
  conversationId: string,
  response: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: response,
        status: 'sent',
        sender_name: 'AI Assistant',
        read: true
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing AI response:', error);
    throw error;
  }
}
