
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { TicketHandler } from './ticket-handler.ts';
import { sendWhatsAppMessage } from '../whatsapp.ts';
import { getExactProduct } from './knowledge-base.ts';

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

interface OrderInfo {
  product: string;
  product_id: string;
  quantity: number;
  state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED';
  confirmed: boolean;
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
    
    const orderInfo: OrderInfo = JSON.parse(pendingOrder.context);
    
    // Verify product still exists and matches exactly
    const exactProduct = await getExactProduct(orderInfo.product);
    if (!exactProduct) {
      console.error('Product verification failed - product no longer exists or has changed');
      await sendWhatsAppMessage(
        context.userId,
        "Sorry, there seems to be an issue with the product. Please try placing your order again.",
        Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
        Deno.env.get('WHATSAPP_PHONE_ID')!
      );
      return true;
    }

    // Verify product ID matches
    if (exactProduct.metadata.product_id !== orderInfo.product_id) {
      console.error('Product ID mismatch detected');
      await sendWhatsAppMessage(
        context.userId,
        "Sorry, there seems to be an issue with the product. Please try placing your order again.",
        Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
        Deno.env.get('WHATSAPP_PHONE_ID')!
      );
      return true;
    }

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
            ...orderInfo,
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
    // Verify product exists and get exact match before storing
    const exactProduct = await getExactProduct(orderInfo.product);
    if (!exactProduct) {
      throw new Error('Product not found or invalid');
    }

    // Add product ID to order info
    const verifiedOrderInfo = {
      ...orderInfo,
      product_id: exactProduct.metadata.product_id,
      product: exactProduct.metadata.title // Use exact product title
    };

    await supabase
      .from('conversation_contexts')
      .insert({
        conversation_id: userId,
        context_type: 'pending_order',
        context: JSON.stringify(verifiedOrderInfo)
      });
  }

  private static isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['yes', 'ow', 'ඔව්'];
    return confirmationWords.includes(message.toLowerCase().trim());
  }
}
