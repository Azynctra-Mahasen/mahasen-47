
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { TicketHandler } from './ticket-handler.ts';
import { sendWhatsAppMessage } from '../whatsapp.ts';
import { UserContext } from '../auth-handler.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('Confirmation message detected:', context.userMessage);
    console.log('Checking for pending order for conversation:', context.userId);

    // Get the pending order from conversation_contexts
    const { data: pendingOrder, error } = await supabase
      .from('conversation_contexts')
      .select('context_data') // Using context_data which is the correct column name
      .eq('conversation_id', context.userId)
      .eq('context_type', 'pending_order')
      .maybeSingle();

    if (error || !pendingOrder) {
      console.log('No pending order found:', error);
      return false;
    }

    try {
      // Parse the order info from context_data
      const orderInfo: PendingOrder = JSON.parse(pendingOrder.context_data);
      console.log('Found pending order:', orderInfo);

      // Update order state to PROCESSING
      const updatedOrderInfo = {
        ...orderInfo,
        state: 'PROCESSING'
      };

      // Extract the phone_number_id from the metadata
      let phoneNumberId = '';
      try {
        const { data: messageMeta } = await supabase
          .from('message_metadata')
          .select('metadata')
          .eq('message_id', context.messageId)
          .maybeSingle();
            
        if (messageMeta?.metadata && typeof messageMeta.metadata === 'object') {
          phoneNumberId = messageMeta.metadata.phone_number_id || '';
          console.log('Retrieved phone_number_id from metadata:', phoneNumberId);
        }
      } catch (e) {
        console.error('Error getting message metadata:', e);
      }

      // If we couldn't get the phone_number_id from the message, use the environment variable
      if (!phoneNumberId) {
        phoneNumberId = Deno.env.get('WHATSAPP_PHONE_ID') || '';
        console.log('Using default WHATSAPP_PHONE_ID:', phoneNumberId);
      }

      // Get the authenticated user context based on the WhatsApp Phone ID
      const { data: platformSecret, error: secretError } = await supabase
        .from('platform_secrets')
        .select('user_id, whatsapp_phone_id, whatsapp_access_token')
        .eq('whatsapp_phone_id', phoneNumberId)
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching user_id from platform_secrets:', secretError);
        await sendWhatsAppMessage(
          context.userId,
          "Order failed. Please retry with correct Product & Quantity in a bit.",
          phoneNumberId,
          Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
        );
        return true;
      }

      if (!platformSecret?.user_id) {
        console.error('No user_id found for this WhatsApp phone ID:', phoneNumberId);
        await sendWhatsAppMessage(
          context.userId,
          "Order failed. Please retry with correct Product & Quantity in a bit.",
          phoneNumberId,
          Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
        );
        return true;
      }

      console.log('Authenticated user ID for ticket creation:', platformSecret.user_id);

      // Update conversation_contexts with the updated order info
      await supabase
        .from('conversation_contexts')
        .update({
          context_data: JSON.stringify(updatedOrderInfo) // Using context_data which is the correct column name
        })
        .eq('conversation_id', context.userId)
        .eq('context_type', 'pending_order');

      // Create ticket with the exact stored order information
      const ticketResponse = await TicketHandler.createOrderTicket(
        platformSecret.user_id,
        context.userName,
        updatedOrderInfo.product,
        updatedOrderInfo.quantity,
        context.whatsappMessageId
      );

      console.log('Ticket creation response:', ticketResponse);

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
          platformSecret.whatsapp_phone_id,
          platformSecret.whatsapp_access_token
        );
        return true;
      } else {
        console.error('Ticket creation failed:', ticketResponse.error);
        // Send order failure message
        await sendWhatsAppMessage(
          context.userId,
          "Order failed. Please retry with correct Product & Quantity in a bit.",
          platformSecret.whatsapp_phone_id,
          platformSecret.whatsapp_access_token
        );
        return true;
      }
    } catch (parseError) {
      console.error('Error parsing pending order:', parseError);
      await sendWhatsAppMessage(
        context.userId,
        "Order failed. There was an error processing your order. Please try again.",
        Deno.env.get('WHATSAPP_PHONE_ID')!,
        Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
      );
      return true;
    }
  }

  static async storePendingOrder(userId: string, orderInfo: any): Promise<void> {
    console.log('Storing new pending order for conversation:', userId, orderInfo);

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
        context_data: JSON.stringify({ // Using context_data which is the correct column name
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
    
    console.log('Successfully stored pending order for conversation:', userId);
  }

  private static isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['yes', 'ow', 'ඔව්'];
    const normalizedMessage = message.toLowerCase().trim();
    const isConfirmation = confirmationWords.some(word => normalizedMessage === word);
    console.log(`Message "${message}" is confirmation: ${isConfirmation}`);
    return isConfirmation;
  }
}
