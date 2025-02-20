
export type IntentType = 'GENERAL_QUERY' | 'SUPPORT_REQUEST' | 'ORDER_PLACEMENT' | 'HUMAN_AGENT_REQUEST';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface OrderInfo {
  state: 'COLLECTING_INFO' | 'READY_TO_PLACE' | 'PLACED';
  products: {
    title?: string;
    price?: number;
    discount?: number;
  }[];
}

export interface IntentAnalysis {
  intent: IntentType;
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: {
    product_mentions: string[];
    issue_type: string | null;
    urgency_level: UrgencyLevel;
    order_info: OrderInfo | null;
  };
}

export interface AISettings {
  tone: string;
  behaviour: string | null;
  model_name: 'llama-3.3-70b-versatile' | 'gemini-2.0-flash-exp';
  context_memory_length: number;
  conversation_timeout_hours: number;
}
