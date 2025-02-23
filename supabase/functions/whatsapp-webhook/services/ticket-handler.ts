
import { AutomatedTicketService } from '../automatedTicketService.ts';
import { IntentProcessor } from './intent-processor.ts';

interface TicketContext {
  messageId: string;
  conversationId: string;
  userName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  knowledgeBaseContext?: string;
}

interface IntentAnalysis {
  intent: string;
  confidence: number;
  requires_escalation?: boolean;
  escalation_reason: string | null;
  detected_entities: {
    product_mentions: string[];
    issue_type: string | null;
    urgency_level: 'low' | 'medium' | 'high';
    order_info?: {
      product: string;
      quantity: number;
      state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED';
      confirmed: boolean;
    };
  };
  response?: string;
}

export class TicketHandler {
  static async handleTicketCreation(
    analysis: IntentAnalysis,
    context: TicketContext
  ): Promise<string | null> {
    console.log('Handling ticket creation with analysis:', analysis);

    // Normalize the escalation property
    const requiresEscalation = analysis.requires_escalation ?? false;

    // Handle order tickets
    if (analysis.intent === 'ORDER_PLACEMENT' &&
        analysis.detected_entities?.order_info) {
      const orderInfo = analysis.detected_entities.order_info;
      
      // If order is not confirmed yet, return the response to ask for confirmation
      if (!orderInfo.confirmed) {
        return analysis.response || 'Please confirm your order.';
      }
      
      // If confirmed, create the ticket
      if (orderInfo.state === 'PROCESSING' && orderInfo.confirmed) {
        return await this.createOrderTicket(analysis, context);
      }
    }

    // Handle support tickets
    if (requiresEscalation || this.shouldEscalate(analysis)) {
      await this.createSupportTicket(analysis, context);
    }

    return null;
  }

  private static shouldEscalate(analysis: IntentAnalysis): boolean {
    return analysis.intent === 'SUPPORT_REQUEST' && 
           analysis.detected_entities.urgency_level === 'high';
  }

  private static async createOrderTicket(analysis: IntentAnalysis, context: TicketContext): Promise<string> {
    const orderInfo = analysis.detected_entities.order_info;
    console.log('Creating order ticket with info:', orderInfo);
    
    try {
      const ticket = await AutomatedTicketService.generateTicket({
        messageId: context.messageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: `Order: ${orderInfo.product} x ${orderInfo.quantity}`,
        context: `Product: ${orderInfo.product}\nQuantity: ${orderInfo.quantity}`,
        whatsappMessageId: context.platform === 'whatsapp' ? context.messageId : undefined
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

  private static async createSupportTicket(analysis: IntentAnalysis, context: TicketContext): Promise<void> {
    try {
      await AutomatedTicketService.generateTicket({
        messageId: context.messageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: context.messageContent,
        context: context.knowledgeBaseContext || '',
        whatsappMessageId: context.platform === 'whatsapp' ? context.messageId : undefined
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }
}
