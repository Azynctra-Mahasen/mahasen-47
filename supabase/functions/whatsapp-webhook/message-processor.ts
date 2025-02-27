import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface OrderContext {
  product_name: string;
  quantity: number;
  price: number;
}

export async function processWhatsAppMessage(
  messageId: string,
  userMessage: string,
  userId: string,
  userName: string,
  phoneId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  console.log(`Processing message ${messageId} from ${userName} (${userId})`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Find or create conversation
    const conversationId = await findOrCreateConversation(supabase, userId, userName);
    
    // Step 2: Check if this is an order confirmation
    if (isOrderConfirmation(userMessage)) {
      // Get the latest order context from conversation_contexts
      const { data: contextData } = await supabase
        .from('conversation_contexts')
        .select('context_data')
        .eq('conversation_id', conversationId)
        .eq('context_type', 'order_placement')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (contextData?.context_data) {
        const orderContext = contextData.context_data as OrderContext;
        
        // Create ticket for the order
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: `Order: ${orderContext.product_name}`,
            customer_name: userName,
            platform: 'whatsapp',
            type: 'Order',
            status: 'New',
            priority: 'HIGH',
            body: `Product: ${orderContext.product_name}\nQuantity: ${orderContext.quantity}`,
            conversation_id: conversationId,
            product_info: orderContext
          })
          .select()
          .single();

        if (ticketError) {
          throw ticketError;
        }

        // Send confirmation message
        const confirmationMessage = `Your Order for ${orderContext.product_name} for ${orderContext.quantity} is placed successfully. Order Number is ${ticket.id}.`;
        
        const response = await fetch(
          `https://graph.facebook.com/v17.0/${phoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: userId,
              type: 'text',
              text: { body: confirmationMessage }
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send WhatsApp confirmation message');
        }

        // Store the confirmation message in the database
        await storeMessage(supabase, conversationId, confirmationMessage, 'system', 'Agent');
      }
    }

    // Step 3: Store the original message
    await storeMessage(supabase, conversationId, userMessage, userId, userName);
    
    console.log(`Message ${messageId} processed successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    throw error;
  }
}

function isOrderConfirmation(message: string): boolean {
  const confirmationKeywords = ['yes', 'ow', 'ඔව්'];
  return confirmationKeywords.some(keyword => 
    message.toLowerCase().trim() === keyword.toLowerCase()
  );
}

async function findOrCreateConversation(
  supabase: any, 
  userId: string, 
  userName: string
): Promise<string> {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('name', userName)
    .single();

  if (conversation) {
    return conversation.id;
  } else {
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        name: userName,
        platform: 'whatsapp'
      })
      .select('id')
      .single();

    return newConversation.id;
  }
}

async function storeMessage(
  supabase: any,
  conversationId: string,
  content: string,
  senderNumber: string,
  senderName: string
): Promise<void> {
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_number: senderNumber,
      sender_name: senderName
    })
    .select();
}
