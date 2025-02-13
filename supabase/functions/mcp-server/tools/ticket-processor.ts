
import { IntentAnalysis } from "../types/intent.ts";
import { initSupabase, logger } from "../utils.ts";

interface CreateTicketParams {
  title: string;
  customerName: string;
  platform: string;
  type: string;
  body: string;
  messageId?: string;
  conversationId?: string;
  intentType?: string;
  context?: string;
  confidenceScore?: number;
  escalationReason?: string;
  priority?: string;
  productInfo?: {
    name: string;
    quantity: number;
  };
}

export async function createTicket(params: CreateTicketParams): Promise<{
  success: boolean;
  ticketId?: number;
  error?: string;
}> {
  const supabase = initSupabase();
  logger.info('Creating ticket:', params);

  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: params.title,
        customer_name: params.customerName,
        platform: params.platform,
        type: params.type,
        status: 'New',
        priority: params.priority || 'LOW',
        body: params.body,
        message_id: params.messageId,
        conversation_id: params.conversationId,
        intent_type: params.intentType,
        context: params.context,
        confidence_score: params.confidenceScore,
        escalation_reason: params.escalationReason,
        product_info: params.productInfo ? {
          name: params.productInfo.name,
          quantity: params.productInfo.quantity
        } : null
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create ticket history entry
    const { error: historyError } = await supabase
      .from('ticket_history')
      .insert({
        ticket_id: ticket.id,
        action: 'Ticket Created',
        new_status: 'New',
        changed_by: 'System'
      });

    if (historyError) {
      logger.error('Error creating ticket history:', historyError);
    }

    return {
      success: true,
      ticketId: ticket.id
    };
  } catch (error) {
    logger.error('Error creating ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function updateTicketProduct(
  ticketId: number,
  productInfo: { name: string; quantity: number }
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = initSupabase();
  logger.info('Updating ticket product info:', { ticketId, productInfo });

  try {
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        product_info: productInfo,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    logger.error('Error updating ticket product info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
