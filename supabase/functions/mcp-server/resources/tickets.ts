
import { ResourceTemplate } from "npm:@modelcontextprotocol/sdk@1.5.0";
import { initSupabase, logger, MCPError } from "../utils.ts";
import { TicketResource } from "../types.ts";

export const ticketResource = new ResourceTemplate(
  "ticket://{status}/{ticketId}",
  { list: "ticket://{status}" }
);

export const handleTicketResource = async (
  uri: URL,
  params: { status?: string; ticketId?: string }
) => {
  const supabase = initSupabase();
  
  try {
    if (params.ticketId) {
      // Single ticket fetch
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          conversation:conversations!tickets_conversation_id_fkey (
            contact_name,
            contact_number,
            platform
          )
        `)
        .eq("id", params.ticketId)
        .single();

      if (error) throw error;
      if (!data) throw new MCPError("Ticket not found", "NOT_FOUND");

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            id: data.id,
            title: data.title,
            type: data.type,
            status: data.status,
            priority: data.priority,
            customerName: data.customer_name,
            platform: data.conversation?.platform,
            body: data.body,
            messageId: data.message_id,
            conversationId: data.conversation_id,
            intentType: data.intent_type,
            context: data.context,
            confidenceScore: data.confidence_score,
            escalationReason: data.escalation_reason,
            assignedTo: data.assigned_to,
            createdAt: data.created_at,
            lastUpdatedAt: data.last_updated_at
          })
        }]
      };
    } else {
      // List tickets by status
      const query = supabase
        .from("tickets")
        .select(`
          *,
          conversation:conversations!tickets_conversation_id_fkey (
            platform
          )
        `);

      if (params.status && params.status !== "*") {
        query.eq("status", params.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        contents: data.map(ticket => ({
          uri: `ticket://${ticket.status}/${ticket.id}`,
          text: JSON.stringify({
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            customerName: ticket.customer_name,
            platform: ticket.conversation?.platform,
            createdAt: ticket.created_at
          })
        }))
      };
    }
  } catch (error) {
    logger.error("Ticket resource error:", error);
    throw error;
  }
};
