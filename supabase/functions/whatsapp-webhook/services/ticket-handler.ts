
import { AutomatedTicketService } from '../automatedTicketService.ts';
import { IntentProcessor } from './intent-processor.ts';

interface TicketContext {
  messageId: string;
  conversationId: string;
  userName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  knowledgeBase?: string;
}

export class TicketHandler {
  static async handleTicketCreation(
    analysis: any,
    context: TicketContext
  ): Promise<string | null> {
    console.log('Handling ticket creation with analysis:', analysis);

    // Handle order tickets
    if (analysis.intent === 'ORDER_PLACEMENT' &&
        analysis.detected_entities.order_info?.state === 'PROCESSING' &&
        analysis.detected_entities.order_info?.confirmed) {
      return await this.createOrderTicket(analysis, context);
    }

    // Handle support tickets
    if (IntentProcessor.evaluateEscalationNeeds(analysis)) {
      await this.createSupportTicket(analysis, context);
    }

    return null;
  }

  private static async createOrderTicket(analysis: any, context: TicketContext): Promise<string> {
    const orderInfo = analysis.detected_entities.order_info;
    console.log('Creating order ticket with info:', orderInfo);
    
    try {
      // Generate a UUID for whatsapp_message_id if needed
      const normalizedMessageId = context.messageId.startsWith('wamid.') 
        ? crypto.randomUUID()  // Generate a new UUID for WhatsApp messages
        : context.messageId;   // Use the existing ID for other platforms

      const ticket = await AutomatedTicketService.generateTicket({
        messageId: normalizedMessageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: `Order: ${orderInfo.product} x ${orderInfo.quantity}`,
        context: `Product: ${orderInfo.product}\nQuantity: ${orderInfo.quantity}`,
        whatsappMessageId: context.messageId // Store the original WhatsApp message ID
      });

      if (ticket) {
        return `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticket.id}.`;
      } else {
        return "Order failed. Please retry with correct Product & Quantity in a bit.";
      }
    } catch (error) {
      console.error('Error creating order ticket:', error);
      return "Order failed. Please retry with correct Product & Quantity in a bit.";
    }
  }

  private static async createSupportTicket(analysis: any, context: TicketContext): Promise<void> {
    try {
      // Generate a UUID for whatsapp_message_id if needed
      const normalizedMessageId = context.messageId.startsWith('wamid.') 
        ? crypto.randomUUID()  // Generate a new UUID for WhatsApp messages
        : context.messageId;   // Use the existing ID for other platforms

      await AutomatedTicketService.generateTicket({
        messageId: normalizedMessageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: context.messageContent,
        context: context.knowledgeBase || '',
        whatsappMessageId: context.messageId // Store the original WhatsApp message ID
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }
}
