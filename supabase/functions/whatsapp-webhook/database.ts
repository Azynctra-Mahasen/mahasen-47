
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
        sender_number: 'system', // Add system as sender_number for AI responses
        read: true
      });

    if (error) {
      console.error('Error storing AI response:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeAIResponse:', error);
    throw error;
  }
}

export async function storeUserMessage(
  supabase: any,
  conversationId: string,
  content: string,
  senderName: string,
  senderNumber: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: content,
        status: 'received',
        sender_name: senderName,
        sender_number: senderNumber,
        read: false
      });

    if (error) {
      console.error('Error storing user message:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeUserMessage:', error);
    throw error;
  }
}
