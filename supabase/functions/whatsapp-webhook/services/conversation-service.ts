
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export class ConversationService {
  static async getOrCreateConversation(userId: string, userName: string): Promise<string> {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error fetching conversation:', convError);
      throw convError;
    }

    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          contact_number: userId,
          contact_name: userName,
          platform: 'whatsapp'
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConv.id;
    }

    return conversation.id;
  }

  static async storeMessage(
    conversationId: string,
    content: string,
    senderName: string,
    senderNumber: string,
    whatsappMessageId: string
  ): Promise<any> {
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content,
        sender_name: senderName,
        sender_number: senderNumber,
        status: 'received',
        whatsapp_message_id: whatsappMessageId
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    return messageData;
  }

  static async getRecentConversationHistory(userId: string, contextLength: number = 2): Promise<string> {
    try {
      console.log('Fetching conversation history for user:', userId);
      
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("contact_number", userId)
        .single();

      if (!conversation) {
        console.log('No existing conversation found for user');
        return '';
      }

      const { data: messages, error } = await supabase
        .from("messages")
        .select("content, sender_name, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(contextLength);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return '';
      }

      if (!messages || messages.length === 0) {
        console.log('No message history found');
        return '';
      }

      const formattedHistory = messages
        .reverse()
        .map(msg => `${msg.sender_name}: ${msg.content}`)
        .join('\n');

      console.log('Retrieved conversation history:', formattedHistory);
      return formattedHistory;
    } catch (error) {
      console.error('Error in getRecentConversationHistory:', error);
      return '';
    }
  }
}
