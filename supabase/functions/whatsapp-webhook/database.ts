
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function storeConversation(
  supabase: any, 
  userId: string, 
  userName: string, 
  userMessage: string,
  platform: 'whatsapp' | 'facebook' | 'instagram'
) {
  try {
    // Check if conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      throw convError;
    }

    let conversationId;
    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          contact_number: userId,
          contact_name: userName,
          platform: platform,
          ai_enabled: true
        })
        .select()
        .single();

      if (createError) throw createError;
      conversationId = newConversation.id;
    } else {
      conversationId = conversation.id;
    }

    // Store user message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: userMessage,
        status: 'received',
        sender_name: userName,
        sender_number: userId,
        read: false
      });

    if (msgError) throw msgError;
    return conversationId;
  } catch (error) {
    console.error('Error storing conversation:', error);
    throw error;
  }
}

// Add a new function to store AI responses
export async function storeAIResponse(
  supabase: any,
  conversationId: string,
  aiResponse: string
) {
  try {
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiResponse,
        status: 'sent',
        sender_name: 'AI Assistant',
        sender_number: 'system',
      });

    if (msgError) throw msgError;
  } catch (error) {
    console.error('Error storing AI response:', error);
    throw error;
  }
}
