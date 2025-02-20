
import { IntentAnalysis } from '../types/intent.ts';

export async function processIntent(message: string): Promise<IntentAnalysis> {
  // Basic intent detection
  const lowerMessage = message.toLowerCase();
  
  // Check for order-related keywords
  const orderKeywords = ['buy', 'order', 'purchase', 'get', 'price'];
  const isOrderIntent = orderKeywords.some(keyword => lowerMessage.includes(keyword));

  if (isOrderIntent) {
    return {
      intent: 'ORDER_PLACEMENT',
      confidence: 0.8,
      requires_escalation: false,
      escalation_reason: null,
      detected_entities: {
        product_mentions: [],
        issue_type: null,
        urgency_level: 'low',
        order_info: {
          state: 'COLLECTING_INFO',
          products: []
        }
      }
    };
  }

  // Default to general query
  return {
    intent: 'GENERAL_QUERY',
    confidence: 0.6,
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
