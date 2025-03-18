
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
      // Using the user's actual ID from platform_secrets for proper isolation
      const { data: platformSecret, error: secretError } = await supabase
        .from('platform_secrets')
        .select('user_id')
        .eq('whatsapp_phone_id', context.whatsappMessageId.split('_')[0])
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching user_id from platform_secrets:', secretError);
        // Fall back to using the conversation user ID if we can't get the platform user ID
        const ticketResponse = await TicketHandler.createOrderTicket(
          context.userId,
          context.userName,
          updatedOrderInfo.product,
          updatedOrderInfo.quantity,
          context.whatsappMessageId
        );

        await this.handleTicketResponse(ticketResponse, updatedOrderInfo, context);
        return true;
      }

      // If we found a platform secret, use that user_id
      const authenticatedUserId = platformSecret?.user_id || context.userId;
      console.log('Authenticated user ID for this platform:', authenticatedUserId);

      // Create ticket with proper user ID
      const ticketResponse = await TicketHandler.createOrderTicket(
        authenticatedUserId,
        context.userName,
        updatedOrderInfo.product,
        updatedOrderInfo.quantity,
        context.whatsappMessageId
      );

      await this.handleTicketResponse(ticketResponse, updatedOrderInfo, context);
      return true;
    } catch (parseError) {
      console.error('Error parsing pending order:', parseError);
      return false;
    }
  }

  private static async handleTicketResponse(
    ticketResponse: { success: boolean; ticketId?: number; error?: string },
    orderInfo: PendingOrder,
    context: OrderContext
  ): Promise<void> {
    // Delete the pending order regardless of success or failure
    await supabase
      .from('conversation_contexts')
      .delete()
      .eq('conversation_id', context.userId)
      .eq('context_type', 'pending_order');

    // Get the actual WhatsApp phone ID and access token to send response message
    const { data: platformSecrets, error: secretsError } = await supabase
      .from('platform_secrets')
      .select('whatsapp_phone_id, whatsapp_access_token')
      .eq('user_id', context.userId)
      .maybeSingle();

    if (secretsError) {
      console.error('Error getting platform secrets:', secretsError);
      return;
    }

    const phoneId = platformSecrets?.whatsapp_phone_id || Deno.env.get('WHATSAPP_PHONE_ID')!;
    const accessToken = platformSecrets?.whatsapp_access_token || Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;

    if (ticketResponse.success) {
      // Send order confirmation message
      await sendWhatsAppMessage(
        context.userId,
        `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticketResponse.ticketId}.`,
        phoneId,
        accessToken
      );
    } else {
      // Send order failure message
      await sendWhatsAppMessage(
        context.userId,
        "Order failed. Please retry with correct Product & Quantity in a bit.",
        phoneId,
        accessToken
      );
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
