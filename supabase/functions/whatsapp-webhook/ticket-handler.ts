
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface TicketCreationParams {
  content: string;
  userName: string;
  userId: string;
  intentType: string;
  context?: string;
  messageId: string;
  conversationId: string;
  supabase: any;
}

export async function handleTicketCreation({
  content,
  userName,
  userId,
  intentType,
  context,
  messageId,
  conversationId,
  supabase
}: TicketCreationParams) {
  try {
    // First, create the ticket without any message association
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: `${intentType} from ${userName}`,
        customer_name: userName,
        body: content,
        platform: 'whatsapp',
        type: intentType,
        status: 'New',
        conversation_id: conversationId,
        intent_type: intentType,
        context: context,
        priority: 'HIGH',
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw ticketError;
    }

    // Now create the message association in a separate call
    if (messageId) {
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          message_id: messageId,
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error linking message to ticket:', messageError);
        // Don't throw here as the ticket was still created successfully
      }
    }

    console.log('Ticket created successfully:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error in ticket creation:', error);
    throw error;
  }
}
