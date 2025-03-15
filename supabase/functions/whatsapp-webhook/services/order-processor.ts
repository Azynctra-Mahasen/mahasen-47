
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
  state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING';
  price?: number;
}

export class OrderProcessor {
  static async handlePendingOrderConfirmation(context: OrderContext): Promise<boolean> {
    try {
      console.log('Checking if message is a confirmation:', context.userMessage);
      
      if (!this.isConfirmationMessage(context.userMessage)) {
        console.log('Not a confirmation message');
        return false;
      }

      console.log('Looking for pending order for user:', context.userId);

      // Get the pending order from conversation_contexts
      const { data: pendingOrderData, error: contextError } = await supabase
        .from('conversation_contexts')
        .select('context')
        .eq('conversation_id', context.userId)
        .eq('context_type', 'pending_order')
        .maybeSingle();

      if (contextError) {
        console.error('Error fetching pending order:', contextError);
        return false;
      }

      if (!pendingOrderData || !pendingOrderData.context) {
        console.log('No pending order found in context');
        return false;
      }

      console.log('Found pending order context:', pendingOrderData.context);
      
      try {
        const orderInfo: PendingOrder = JSON.parse(pendingOrderData.context);
        console.log('Parsed pending order:', orderInfo);

        if (orderInfo.state !== 'CONFIRMING') {
          console.log('Order not in confirming state:', orderInfo.state);
          return false;
        }

        // Update order state to PROCESSING
        orderInfo.state = 'PROCESSING';

        // Get user authentication from platform_secrets
        const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID');
        console.log('Looking up user for WhatsApp phone ID:', whatsappPhoneId);

        const { data: platformSecrets, error: secretsError } = await supabase
          .from('platform_secrets')
          .select('user_id')
          .eq('whatsapp_phone_id', whatsappPhoneId)
          .maybeSingle();

        if (secretsError || !platformSecrets) {
          console.error('Error finding user ID from platform_secrets:', secretsError);
          await this.sendOrderResponse(
            context.userId, 
            "Order failed. System could not authenticate your request. Please contact support.",
            whatsappPhoneId!
          );
          return true;
        }

        const authenticatedUserId = platformSecrets.user_id;
        console.log('Authenticated user for ticket creation:', authenticatedUserId);

        if (!authenticatedUserId) {
          console.error('No authenticated user found for this WhatsApp phone ID');
          await this.sendOrderResponse(
            context.userId, 
            "Order failed. User authentication error. Please contact support.",
            whatsappPhoneId!
          );
          return true;
        }

        // Create ticket with the authenticated user
        console.log('Creating ticket with user ID:', authenticatedUserId);
        const ticketResponse = await TicketHandler.createOrderTicket(
          authenticatedUserId,
          context.userName,
          orderInfo.product,
          orderInfo.quantity,
          context.whatsappMessageId
        );

        console.log('Ticket creation response:', ticketResponse);

        // Delete the pending order context after processing
        const { error: deleteError } = await supabase
          .from('conversation_contexts')
          .delete()
          .eq('conversation_id', context.userId)
          .eq('context_type', 'pending_order');

        if (deleteError) {
          console.error('Error deleting pending order context:', deleteError);
        }

        // Send appropriate response based on ticket creation result
        if (ticketResponse.success) {
          await this.sendOrderResponse(
            context.userId,
            `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticketResponse.ticketId}.`,
            whatsappPhoneId!
          );
        } else {
          await this.sendOrderResponse(
            context.userId,
            "Order failed. Please retry with correct Product & Quantity in a bit.",
            whatsappPhoneId!
          );
        }

        return true;
      } catch (parseError) {
        console.error('Error parsing pending order JSON:', parseError);
        return false;
      }
    } catch (error) {
      console.error('Unexpected error in handlePendingOrderConfirmation:', error);
      return false;
    }
  }

  static async storePendingOrder(userId: string, orderInfo: any): Promise<void> {
    try {
      console.log('Storing new pending order for user', userId, ':', orderInfo);

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
      
      console.log('Successfully stored pending order for user:', userId);
    } catch (error) {
      console.error('Error in storePendingOrder:', error);
      throw error;
    }
  }

  private static async sendOrderResponse(
    userId: string, 
    message: string, 
    whatsappPhoneId: string
  ): Promise<void> {
    try {
      await sendWhatsAppMessage(
        userId,
        message,
        whatsappPhoneId,
        Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
      );
      console.log('Sent order response to user:', userId);
    } catch (error) {
      console.error('Error sending order response:', error);
    }
  }

  private static isConfirmationMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    const confirmationWords = ['yes', 'ow', 'ඔව්'];
    return confirmationWords.includes(lowerMessage);
  }
}
