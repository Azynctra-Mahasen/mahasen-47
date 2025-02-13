
import { IntentAnalysis, IntentType, TicketCreationInfo, TicketType, TicketPriority } from '../types/intent.ts';
import { HUMAN_AGENT_KEYWORDS, INTENT_KEYWORDS } from './keywordMatchers.ts';
import { ContextAnalyzer } from './contextAnalyzer.ts';

export class IntentDetectionService {
  static analyzeIntent(
    message: string,
    knowledgeBaseContext: string | null = null,
    previousMessages: string[] = []
  ): IntentAnalysis {
    const lowerMessage = message.toLowerCase();
    console.log('Analyzing intent for message:', message);
    
    // Enhanced human agent request detection with fuzzy matching
    const hasHumanAgentRequest = HUMAN_AGENT_KEYWORDS.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return lowerMessage.includes(keywordLower) || 
             this.calculateSimilarity(lowerMessage, keywordLower) > 0.8;
    });

    if (hasHumanAgentRequest) {
      console.log('Human agent request detected');
      return {
        intent: 'HUMAN_AGENT_REQUEST',
        confidence: 0.95,
        requires_escalation: true,
        escalation_reason: 'Customer explicitly requested human agent',
        detected_entities: {
          product_mentions: [],
          issue_type: ContextAnalyzer.detectIssueType(message),
          urgency_level: 'high'
        }
      };
    }

    // Calculate context match score
    const contextMatch = knowledgeBaseContext 
      ? ContextAnalyzer.calculateContextMatch(message, knowledgeBaseContext)
      : 0;

    // Determine primary intent
    let primaryIntent: IntentType = 'GENERAL_QUERY';
    let highestConfidence = 0;

    const intents: IntentType[] = [
      'SUPPORT_REQUEST',
      'ORDER_PLACEMENT',
      'GENERAL_QUERY'
    ];

    for (const intent of intents) {
      const confidence = ContextAnalyzer.calculateConfidence(
        message,
        intent,
        contextMatch,
        previousMessages
      );
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        primaryIntent = intent;
      }
    }

    const urgencyLevel = ContextAnalyzer.detectUrgencyLevel(message);
    const { required: requires_escalation, reason: escalation_reason } = 
      ContextAnalyzer.requiresEscalation(primaryIntent, highestConfidence, urgencyLevel);

    const analysis = {
      intent: primaryIntent,
      confidence: highestConfidence,
      requires_escalation,
      escalation_reason,
      detected_entities: {
        product_mentions: [],
        issue_type: ContextAnalyzer.detectIssueType(message),
        urgency_level: urgencyLevel
      }
    };

    console.log('Intent analysis result:', analysis);
    return analysis;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  private static editDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i-1] === str2[j-1]) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j-1] + 1,
            matrix[i][j-1] + 1,
            matrix[i-1][j] + 1
          );
        }
      }
    }
    
    return matrix[str1.length][str2.length];
  }

  static generateTicketInfo(
    analysis: IntentAnalysis,
    messageId: string,
    context: string
  ): TicketCreationInfo | null {
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      return null;
    }

    const ticketType: TicketType = 
      analysis.intent === 'ORDER_PLACEMENT' ? 'ORDER' : 
      analysis.intent === 'HUMAN_AGENT_REQUEST' ? 'REQUEST' : 'SUPPORT';

    const priority: TicketPriority = 
      analysis.detected_entities.urgency_level === 'high' ? 'HIGH' :
      analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW';

    return {
      create_ticket: true,
      ticket_type: ticketType,
      priority,
      context,
      message_id: messageId,
      required_actions: this.generateRequiredActions(analysis)
    };
  }

  private static generateRequiredActions(analysis: IntentAnalysis): string[] {
    const actions: string[] = [];

    if (analysis.requires_escalation) {
      actions.push('Escalate to human agent');
    }

    if (analysis.intent === 'ORDER_PLACEMENT') {
      actions.push('Verify order details');
      actions.push('Check inventory availability');
    }

    if (analysis.intent === 'SUPPORT_REQUEST') {
      actions.push('Review related knowledge base articles');
      if (analysis.detected_entities.issue_type) {
        actions.push(`Check ${analysis.detected_entities.issue_type} documentation`);
      }
    }

    return actions;
  }
}
