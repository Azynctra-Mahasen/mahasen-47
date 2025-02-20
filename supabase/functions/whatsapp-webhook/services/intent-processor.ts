
import { IntentAnalysis } from '../types/intent.ts';

export async function processIntent(message: string): Promise<IntentAnalysis> {
  // For now, return a basic intent analysis
  return {
    intent: 'GENERAL_QUERY',
    confidence: 0.8,
    requires_escalation: false,
    escalation_reason: null,
    detected_entities: {
      product_mentions: [],
      issue_type: null,
      urgency_level: 'low',
      order_info: null
    }
  };
}
