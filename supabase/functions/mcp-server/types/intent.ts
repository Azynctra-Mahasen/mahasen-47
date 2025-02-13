
export type IntentType = 'SUPPORT_REQUEST' | 'HUMAN_AGENT_REQUEST' | 'ORDER_PLACEMENT' | 'GENERAL_QUERY';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketType = 'SUPPORT' | 'REQUEST' | 'ORDER';

export interface DetectedEntities {
  product_mentions: string[];
  issue_type: string | null;
  urgency_level: UrgencyLevel;
}

export interface IntentAnalysis {
  intent: IntentType;
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: DetectedEntities;
}

export interface TicketCreationInfo {
  create_ticket: boolean;
  ticket_type: TicketType;
  priority: TicketPriority;
  context: string;
  message_id: string;
  required_actions: string[];
}
