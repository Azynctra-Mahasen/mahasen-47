
import { IntentAnalysis } from '../types/intent.ts';
import { SearchResult } from './knowledge-base.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class IntentProcessor {
  static async processIntent(message: string, searchResults: SearchResult[]): Promise<IntentAnalysis> {
    try {
      const productResults = searchResults.filter(r => r.source === 'product');
      
      // Check if message contains product inquiries
      const hasProductMentions = productResults.length > 0;
      const hasPriceInquiry = message.toLowerCase().includes('price') ||
                             message.toLowerCase().includes('cost') ||
                             message.toLowerCase().includes('how much');
      
      const isProductQuery = hasProductMentions || hasPriceInquiry;

      let intent: IntentAnalysis = {
        intent: isProductQuery ? 'ORDER_PLACEMENT' : 'GENERAL_QUERY',
        confidence: isProductQuery ? 0.8 : 0.6,
        requires_escalation: false,
        escalation_reason: null,
        detected_entities: {
          product_mentions: productResults.map(p => p.metadata?.title || '').filter(Boolean),
          issue_type: null,
          urgency_level: 'low',
          order_info: isProductQuery ? {
            state: 'COLLECTING_INFO',
            products: productResults.map(p => ({
              title: p.metadata?.title,
              price: p.metadata?.price,
              discount: p.metadata?.discounts
            }))
          } : null
        }
      };

      // Increase confidence for exact product matches
      if (hasProductMentions) {
        intent.confidence = 0.9;
      }

      return intent;
    } catch (error) {
      console.error('Error in intent processing:', error);
      throw error;
    }
  }

  static validateIntentStructure(response: any): boolean {
    return (
      response &&
      typeof response.intent === 'string' &&
      typeof response.confidence === 'number' &&
      typeof response.requires_escalation === 'boolean' &&
      response.detected_entities &&
      typeof response.response === 'string'
    );
  }

  static evaluateEscalationNeeds(analysis: any): boolean {
    return (
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities?.urgency_level === 'high')
    );
  }
}
