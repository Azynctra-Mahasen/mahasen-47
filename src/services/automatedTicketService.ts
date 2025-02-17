import { IntentAnalysis } from "@/types/intent";
import { Platform, TicketPriority, TicketType } from "@/types/ticket";
import { TicketService } from "./ticketService";
import { toast } from "@/hooks/use-toast";

interface AutomatedTicketParams {
  messageId: string;
  conversationId: string;
  analysis: IntentAnalysis;
  customerName: string;
  platform: Platform;
  messageContent: string;
  context: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: AutomatedTicketParams) {
    const shouldCreateTicket = this.evaluateTicketCreationCriteria(params.analysis);
    console.log('Ticket creation criteria met:', shouldCreateTicket);
    
    if (shouldCreateTicket) {
      const ticketData = {
        title: this.generateTicketTitle(params.analysis),
        customerName: params.customerName,
        platform: params.platform,
        type: params.analysis.detected_entities?.issue_type || "General",
        body: params.messageContent,
        messageId: params.messageId,
        conversationId: params.conversationId,
        intentType: this.determineTicketType(params.analysis),
        context: params.context,
        confidenceScore: params.analysis.confidence,
        escalationReason: params.analysis.escalation_reason || undefined,
        priority: this.determinePriority(params.analysis)
      };

      return await TicketService.createTicket(ticketData);
    }
    
    return null;
  }

  private static evaluateTicketCreationCriteria(analysis: IntentAnalysis): boolean {
    return (
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities?.urgency_level === 'high')
    );
  }

  private static determinePriority(analysis: IntentAnalysis): TicketPriority {
    if (analysis.intent === 'HUMAN_AGENT_REQUEST' || 
        analysis.detected_entities?.urgency_level === 'high') {
      return 'HIGH';
    }
    
    if (analysis.detected_entities?.urgency_level === 'medium') {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private static determineTicketType(analysis: IntentAnalysis): TicketType {
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