
export type IntentType = 'GENERAL_QUERY' | 'SUPPORT_REQUEST' | 'ORDER_PLACEMENT' | 'HUMAN_AGENT_REQUEST';

export interface OrderInfo {
  state: 'COLLECTING_INFO' | 'READY_TO_PLACE' | 'PLACED';
  products: Array<{
    title?: string;
    quantity?: number;
    price?: number;
  }>;
}

export interface IntentAnalysis {
  intent: IntentType;
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: {
    product_mentions: string[];
    issue_type: string | null;
    urgency_level: 'low' | 'medium' | 'high';
    order_info: OrderInfo | null;
  };
}
