
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { TicketHandler } from './ticket-handler.ts';
import { sendWhatsAppMessage } from '../whatsapp.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface OrderContext {
  messageId: string;
  userId: string;
  userName: string;
  whatsappMessageId: string;
  userMessage: string;
}

export class OrderProcessor {
  static async handlePendingOrderConfirmation(context: OrderContext): Promise<boolean> {
    const { data: pendingOrder } = await supabase
      .from('conversation_contexts')
      .select('*')
      .eq('conversation_id', context.userId)
      .eq('context_type', 'pending_order')
      .single();

    if (!pendingOrder || !this.isConfirmationMessage(context.userMessage)) {
      return false;
    }

    console.log('Processing order confirmation for pending order:', pendingOrder);
    
    const orderInfo = JSON.parse(pendingOrder.context);
    const ticketResponse = await TicketHandler.handleTicketCreation(
      {
        intent: 'ORDER_PLACEMENT',
        confidence: 1,
        requires_escalation: false,
        escalation_reason: null,
        detected_entities: {
          product_mentions: [orderInfo.product],
          issue_type: null,
          urgency_level: 'medium',
          order_info: {
            product: orderInfo.product,
            quantity: orderInfo.quantity,
            state: 'PROCESSING',
            confirmed: true
          }
        }
      },
      {
        messageId: context.whatsappMessageId,
        conversationId: context.userId,
        userName: context.userName,
        platform: 'whatsapp',
        messageContent: context.userMessage
      }
    );

    // Clear the pending order context
    await supabase
      .from('conversation_contexts')
      .delete()
      .eq('id', pendingOrder.id);

    // Send the ticket response if available
    if (ticketResponse) {
      await sendWhatsAppMessage(
        context.userId,
        ticketResponse,
        Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
        Deno.env.get('WHATSAPP_PHONE_ID')!
      );
      return true;
    }

    return false;
  }

  static async storePendingOrder(userId: string, orderInfo: any): Promise<void> {
    await supabase
      .from('conversation_contexts')
      .insert({
        conversation_id: userId,
        context_type: 'pending_order',
        context: JSON.stringify(orderInfo)
      });
  }

  private static isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['yes', 'ow', 'ඔව්'];
    return confirmationWords.includes(message.toLowerCase().trim());
  }
}
