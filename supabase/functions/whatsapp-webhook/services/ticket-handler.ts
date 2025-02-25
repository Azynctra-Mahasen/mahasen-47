
import { AutomatedTicketService } from '../automatedTicketService.ts';

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
  requires_to_escalation?: boolean;
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
    const requiresEscalation = analysis.requires_escalation ?? analysis.requires_to_escalation ?? false;

    // Handle order tickets
    if (analysis.intent === 'ORDER_PLACEMENT') {
      const orderInfo = analysis.detected_entities?.order_info;
      
      // Only process if we have order info
      if (orderInfo) {
        // If in COLLECTING_INFO or CONFIRMING state, just return the response for confirmation
        if (orderInfo.state === 'COLLECTING_INFO' || orderInfo.state === 'CONFIRMING') {
          return analysis.response || 'Please confirm your order.';
        }
        
        // Only create ticket if order is confirmed and in PROCESSING state
        if (orderInfo.state === 'PROCESSING' && orderInfo.confirmed) {
          try {
            const ticket = await this.createOrderTicket(analysis, context);
            if (ticket) {
              return `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticket.id}.`;
            }
          } catch (error) {
            console.error('Error creating order ticket:', error);
            return "Order failed. Please retry with correct Product & Quantity in a bit.";
          }
        }
      }
    }

    // Handle support tickets
    if (requiresEscalation || this.shouldEscalate(analysis)) {
      try {
        await this.createSupportTicket(analysis, context);
      } catch (error) {
        console.error('Error creating support ticket:', error);
      }
    }

    return null;
  }

  private static shouldEscalate(analysis: IntentAnalysis): boolean {
    return analysis.intent === 'SUPPORT_REQUEST' && 
           analysis.detected_entities.urgency_level === 'high';
  }

  private static async createOrderTicket(analysis: IntentAnalysis, context: TicketContext) {
    const orderInfo = analysis.detected_entities.order_info;
    if (!orderInfo) return null;

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
        whatsappMessageId: context.messageId // Using messageId as whatsappMessageId for WhatsApp platform
      });

      return ticket;
    } catch (error) {
      console.error('Error in createOrderTicket:', error);
      throw error;
    }
  }

  private static async createSupportTicket(analysis: IntentAnalysis, context: TicketContext) {
    try {
      return await AutomatedTicketService.generateTicket({
        messageId: context.messageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: context.messageContent,
        context: context.knowledgeBaseContext || '',
        whatsappMessageId: context.messageId // Using messageId as whatsappMessageId for WhatsApp platform
      });
    } catch (error) {
      console.error('Error in createSupportTicket:', error);
      throw error;
    }
  }
}
