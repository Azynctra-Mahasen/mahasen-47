
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

interface PendingOrder {
  product: string;
  quantity: number;
  state: 'CONFIRMING' | 'PROCESSING';
  price?: number;
}

export class OrderProcessor {
  static async handlePendingOrderConfirmation(context: OrderContext): Promise<boolean> {
    if (!this.isConfirmationMessage(context.userMessage)) {
      return false;
    }

    console.log('Checking for pending order for user:', context.userId);

    // Get the pending order from conversation_contexts
    const { data: pendingOrder, error } = await supabase
      .from('conversation_contexts')
      .select('context')
      .eq('conversation_id', context.userId)
      .eq('context_type', 'pending_order')
      .maybeSingle();

    if (error || !pendingOrder) {
      console.log('No pending order found:', error);
      return false;
    }

    try {
      const orderInfo: PendingOrder = JSON.parse(pendingOrder.context);
      console.log('Found pending order:', orderInfo);

      // Update order state to PROCESSING
      const updatedOrderInfo = {
        ...orderInfo,
        state: 'PROCESSING'
      };

      // Create ticket with the exact stored order information
      const ticketResponse = await TicketHandler.createOrderTicket(
        context.userId,
        context.userName,
        updatedOrderInfo.product,
        updatedOrderInfo.quantity,
        context.whatsappMessageId
      );

      if (ticketResponse.success) {
        // Delete the pending order after successful ticket creation
        await supabase
          .from('conversation_contexts')
          .delete()
          .eq('conversation_id', context.userId)
          .eq('context_type', 'pending_order');

        // Send order confirmation message
        await sendWhatsAppMessage(
          context.userId,
          `Your Order for ${updatedOrderInfo.product} for ${updatedOrderInfo.quantity} is placed successfully. Order Number is ${ticketResponse.ticketId}.`,
          Deno.env.get('WHATSAPP_PHONE_ID')!,
          Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
        );
        return true;
      } else {
        // Send order failure message
        await sendWhatsAppMessage(
          context.userId,
          "Order failed. Please retry with correct Product & Quantity in a bit.",
          Deno.env.get('WHATSAPP_PHONE_ID')!,
          Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
        );
        return true;
      }
    } catch (parseError) {
      console.error('Error parsing pending order:', parseError);
      return false;
    }
  }

  static async storePendingOrder(userId: string, orderInfo: any): Promise<void> {
    console.log('Storing new pending order:', orderInfo);

    // Delete any existing pending orders first
    await supabase
      .from('conversation_contexts')
      .delete()
      .eq('conversation_id', userId)
      .eq('context_type', 'pending_order');

    // Store the new pending order
    const { error } = await supabase
      .from('conversation_contexts')
      .insert({
        conversation_id: userId,
        context_type: 'pending_order',
        context: JSON.stringify({
          product: orderInfo.product,
          quantity: orderInfo.quantity,
          state: 'CONFIRMING',
          price: orderInfo.price
        })
      });

    if (error) {
      console.error('Error storing pending order:', error);
      throw error;
    }
  }

  private static isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['yes', 'ow', 'ඔව්'];
    return confirmationWords.some(word => message.toLowerCase().trim() === word);
  }
}
