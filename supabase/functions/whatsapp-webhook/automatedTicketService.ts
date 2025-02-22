
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface TicketGenerationParams {
  messageId: string;
  conversationId: string;
  analysis: any;
  customerName: string;
  platform: string;
  messageContent: string;
  context?: string;
  whatsappMessageId?: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: TicketGenerationParams) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating ticket with params:', params);

    try {
      // Create the ticket
      const ticketData = {
        title: `${params.analysis.intent || 'Support'} Request from ${params.customerName}`,
        customer_name: params.customerName,
        platform: params.platform,
        type: params.analysis.intent || 'SUPPORT',
        status: 'New',
        body: params.messageContent,
        priority: 'HIGH',
        intent_type: params.analysis.intent,
        context: params.context,
        conversation_id: params.conversationId,
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      };

      // Add whatsapp_message_id if it exists
      if (params.whatsappMessageId) {
        ticketData['whatsapp_message_id'] = params.whatsappMessageId;
      }

      // Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw ticketError;
      }

      // Create ticket_messages association
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          message_id: params.messageId,
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error creating ticket message association:', messageError);
        // Don't throw here as the ticket was still created successfully
      }

      return ticket;
    } catch (error) {
      console.error('Error in generateTicket:', error);
      throw error;
    }
  }
}
