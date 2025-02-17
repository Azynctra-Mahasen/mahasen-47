
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface IntentAnalysis {
  intent: string;
  confidence: number;
  requires_escalation: boolean;
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
}

interface AutomatedTicketParams {
  messageId: string;
  conversationId: string;
  analysis: IntentAnalysis;
  customerName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  context: string;
  whatsappMessageId?: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: AutomatedTicketParams) {
    console.log('Starting ticket generation with params:', params);
    
    const shouldCreateTicket = this.evaluateTicketCreationCriteria(params.analysis);
    console.log('Ticket creation criteria met:', shouldCreateTicket);
    
    if (shouldCreateTicket) {
      const ticketData = {
        title: this.generateTicketTitle(params.analysis),
        customer_name: params.customerName,
        platform: params.platform,
        type: params.analysis.detected_entities?.issue_type || "Order",
        body: params.messageContent,
        message_id: params.messageId,
        conversation_id: params.conversationId,
        whatsapp_message_id: params.whatsappMessageId, // Store the original WhatsApp message ID
        intent_type: this.determineTicketType(params.analysis),
        context: params.context,
        confidence_score: params.analysis.confidence,
        escalation_reason: params.analysis.escalation_reason || undefined,
        priority: this.determinePriority(params.analysis),
        status: 'New'
      };

      console.log('Attempting to create ticket with data:', ticketData);

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      console.log('Successfully created ticket:', ticket);
      return ticket;
    }
    
    return null;
  }

  private static evaluateTicketCreationCriteria(analysis: IntentAnalysis): boolean {
    // Check for order placement with confirmation
    if (analysis.intent === 'ORDER_PLACEMENT' && 
        analysis.detected_entities.order_info?.state === 'PROCESSING' && 
        analysis.detected_entities.order_info?.confirmed) {
      return true;
    }

    // Keep existing criteria
    return (
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities?.urgency_level === 'high')
    );
  }

  private static determinePriority(analysis: IntentAnalysis): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Orders always get HIGH priority
    if (analysis.intent === 'ORDER_PLACEMENT' && 
        analysis.detected_entities.order_info?.confirmed) {
      return 'HIGH';
    }
    
    if (analysis.intent === 'HUMAN_AGENT_REQUEST' || 
        analysis.detected_entities?.urgency_level === 'high') {
      return 'HIGH';
    }
    
    if (analysis.detected_entities?.urgency_level === 'medium') {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private static determineTicketType(analysis: IntentAnalysis): string {
    if (analysis.intent === 'ORDER_PLACEMENT' && 
        analysis.detected_entities.order_info?.confirmed) {
      return 'ORDER';
    }

    switch (analysis.intent) {
      case 'ORDER_PLACEMENT':
        return 'ORDER';
      case 'HUMAN_AGENT_REQUEST':
        return 'REQUEST';
      default:
        return 'SUPPORT';
    }
  }

  private static generateTicketTitle(analysis: IntentAnalysis): string {
    if (analysis.intent === 'ORDER_PLACEMENT' && 
        analysis.detected_entities.order_info?.confirmed) {
      const { product, quantity } = analysis.detected_entities.order_info;
      return `Order: ${product} (Qty: ${quantity})`;
    }

    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      return 'Human Agent Request';
    }

    const issueType = analysis.detected_entities?.issue_type;
    if (issueType) {
      return `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} Support Request`;
    }

    return 'Support Request';
  }
}
