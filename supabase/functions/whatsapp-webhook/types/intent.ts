
export interface IntentAnalysis {
  intent: 'HUMAN_AGENT_REQUEST' | 'SUPPORT_REQUEST' | 'ORDER_PLACEMENT' | 'GENERAL_QUERY';
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: {
    product_mentions: string[];
    issue_type: string | null;
    urgency_level: 'high' | 'medium' | 'low';
    order_info?: {
      product: string | null;
      quantity: number;
      state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED';
      confirmed: boolean;
    };
  };
  response: string;
}
