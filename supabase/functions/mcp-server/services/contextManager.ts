
import { ConversationContext, KnowledgeBaseContext, Platform } from "../types/prompt.ts";
import { initSupabase, logger } from "../utils.ts";

export class ContextManager {
  static async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    const supabase = initSupabase();
    logger.info('Getting conversation context for:', conversationId);
    
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          platform,
          language,
          messages (
            content,
            sender_name,
            created_at
          ),
          conversation_contexts (
            context_type,
            context_data
          )
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      if (!conversation) return null;

      // Format messages for context
      const previousMessages = conversation.messages
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((msg: any) => ({
          role: msg.sender_name === 'AI Assistant' ? 'assistant' : 'user',
          content: msg.content,
          timestamp: msg.created_at
        }));

      // Get order state if exists
      const orderState = conversation.conversation_contexts
        ?.find((ctx: any) => ctx.context_type === 'order_state')
        ?.context_data;

      // Get last intent if exists
      const lastIntent = conversation.conversation_contexts
        ?.find((ctx: any) => ctx.context_type === 'last_intent')
        ?.context_data?.intent;

      return {
        previousMessages,
        platform: conversation.platform as Platform,
        language: conversation.language || 'en',
        lastIntent,
        orderState: orderState || undefined
      };
    } catch (error) {
      logger.error('Error getting conversation context:', error);
      return null;
    }
  }

  static async updateOrderState(
    conversationId: string, 
    orderState: ConversationContext['orderState']
  ): Promise<boolean> {
    const supabase = initSupabase();
    logger.info('Updating order state for:', { conversationId, orderState });

    try {
      const { error } = await supabase
        .from('conversation_contexts')
        .upsert({
          conversation_id: conversationId,
          context_type: 'order_state',
          context_data: orderState
        }, {
          onConflict: 'conversation_id,context_type'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating order state:', error);
      return false;
    }
  }

  static async getKnowledgeBaseContext(query: string): Promise<KnowledgeBaseContext | null> {
    const supabase = initSupabase();
    logger.info('Getting knowledge base context for query:', query);

    try {
      const { data: matches, error } = await supabase.rpc('match_knowledge_base', {
        query_text: query,
        match_count: 3,
        match_threshold: 0.7
      });

      if (error) throw error;

      return {
        relevantArticles: matches.map((m: any) => ({
          id: m.id,
          content: m.content,
          similarity: m.similarity
        })),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting knowledge base context:', error);
      return null;
    }
  }
}
