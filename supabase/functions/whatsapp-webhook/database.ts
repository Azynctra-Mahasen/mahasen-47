
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function storeConversation(supabase: any, userId: string, userName: string, userMessage: string, aiResponse: string) {
  try {
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
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          contact_number: userId,
          contact_name: userName,
          platform: 'whatsapp'
        })
        .select()
        .single();

      if (createError) throw createError;
      conversationId = newConversation?.id;
    } else {
      conversationId = conversation.id;
    }

    // Only insert AI response message since user message is already stored
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: aiResponse,
      status: 'sent',
      sender_name: 'AI Assistant',
      sender_number: 'system'
    });

    if (msgError) throw msgError;
    
    return conversationId;
  } catch (error) {
    console.error('Error storing conversation:', error);
    throw error;
  }
}
