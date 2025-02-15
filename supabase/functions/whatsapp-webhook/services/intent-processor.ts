
import { IntentAnalysis } from '../types/intent.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class IntentProcessor {
  static async processIntent(message: string, context: string): Promise<IntentAnalysis> {
    try {
      // Get products info
      const { data: products } = await supabase
        .from('products')
        .select('*');
      
      // Check if message contains product inquiries
      const isProductQuery = products?.some(product => 
        message.toLowerCase().includes(product.title.toLowerCase()) ||
        message.toLowerCase().includes('price') ||
        message.toLowerCase().includes('product') ||
        message.toLowerCase().includes('cost')
      );

      let intent: IntentAnalysis = {
        intent: isProductQuery ? 'ORDER_PLACEMENT' : 'GENERAL_QUERY',
        confidence: isProductQuery ? 0.8 : 0.6,
        requires_escalation: false,
        escalation_reason: null,
        detected_entities: {
          product_mentions: products?.filter(product => 
            message.toLowerCase().includes(product.title.toLowerCase())
          ).map(p => p.title) || [],
          issue_type: null,
          urgency_level: 'low'
        }
      };

      // Add product-specific logic
      if (isProductQuery && products) {
        const mentionedProducts = products.filter(product => 
          message.toLowerCase().includes(product.title.toLowerCase())
        );

        if (mentionedProducts.length > 0) {
          intent.confidence = 0.9;
          intent.detected_entities.product_mentions = mentionedProducts.map(p => p.title);
        }
      }

      return intent;
    } catch (error) {
      console.error('Error in intent processing:', error);
      throw error;
    }
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
