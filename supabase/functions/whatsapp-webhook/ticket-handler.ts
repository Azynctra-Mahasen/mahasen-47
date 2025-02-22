
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
    // Create the ticket
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
        priority: 'HIGH'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Link the message to the ticket
    await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        message_id: messageId
      });

    console.log('Ticket created successfully:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}
