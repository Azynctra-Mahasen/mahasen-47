
import { ResourceTemplate } from "npm:@modelcontextprotocol/sdk@1.5.0";
import { initSupabase, logger, MCPError } from "../utils.ts";
import { ConversationResource } from "../types.ts";

export const conversationResource = new ResourceTemplate(
  "conversation://{platform}/{conversationId}",
  { list: "conversation://{platform}" }
);

export const handleConversationResource = async (
  uri: URL,
  params: { platform?: string; conversationId?: string }
) => {
  const supabase = initSupabase();
  
  try {
    if (params.conversationId) {
      // Fetch single conversation with messages
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          messages (
            content,
            sender_name,
            sender_number,
            created_at,
            status
          ),
          conversation_contexts (
            context_type,
            context_data
          )
        `)
        .eq("id", params.conversationId)
        .single();

      if (convError) throw convError;
      if (!conversation) throw new MCPError("Conversation not found", "NOT_FOUND");

      // Format messages for the response
      const messages = conversation.messages.map((msg: any) => ({
        role: msg.sender_number === 'system' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.created_at
      }));

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            id: conversation.id,
            platform: conversation.platform,
            messages,
            metadata: {
              contactName: conversation.contact_name,
              contactNumber: conversation.contact_number,
              lastUpdated: conversation.updated_at,
              contexts: conversation.conversation_contexts
            }
          })
        }]
      };
    } else {
      // List conversations for platform
      const query = supabase
        .from("conversations")
        .select(`
          id,
          platform,
          contact_name,
          contact_number,
          updated_at,
          metadata
        `);

      if (params.platform && params.platform !== "*") {
        query.eq("platform", params.platform);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        contents: data.map(conv => ({
          uri: `conversation://${conv.platform}/${conv.id}`,
          text: JSON.stringify({
            id: conv.id,
            platform: conv.platform,
            metadata: {
              contactName: conv.contact_name,
              contactNumber: conv.contact_number,
              lastUpdated: conv.updated_at
            }
          })
        }))
      };
    }
  } catch (error) {
    logger.error("Conversation resource error:", error);
    throw error;
  }
};
