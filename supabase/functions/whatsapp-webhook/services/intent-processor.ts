
import { IntentAnalysis } from '../types/intent.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const processIntent = async (message: string): Promise<IntentAnalysis> => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Default intent analysis structure
    let intent: IntentAnalysis = {
      intent: 'GENERAL_QUERY',
      confidence: 0.7,
      requires_escalation: false,
      escalation_reason: null,
      detected_entities: {
        product_mentions: [],
        issue_type: null,
        urgency_level: 'low',
        order_info: null
      }
    };

    // Check for order-related keywords
    const orderKeywords = ['order', 'buy', 'purchase', 'get', 'want'];
    const hasOrderIntent = orderKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (hasOrderIntent) {
      console.log('Detected order intent');
      intent.intent = 'ORDER_PLACEMENT';
      intent.confidence = 0.85;
      
      // Try to find any product mentions
      const { data: searchResults, error } = await supabase.rpc(
        'match_knowledge_base_and_products',
        { 
          query_text: message,
          query_embedding: [], // We'll implement proper embeddings later
          match_count: 5
        }
      );

      if (!error && searchResults) {
        const products = searchResults
          .filter(result => result.source === 'product')
          .map(product => ({
            title: product.metadata?.title,
            price: product.metadata?.price
          }));

        if (products.length > 0) {
          intent.detected_entities.order_info = {
            state: 'COLLECTING_INFO',
            products: products
          };
          intent.confidence = 0.9;
        }
      }
    }

    // Check for support-related keywords
    const supportKeywords = ['help', 'support', 'issue', 'problem', 'broken'];
    const hasSupportIntent = supportKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (hasSupportIntent) {
      intent.intent = 'SUPPORT_REQUEST';
      intent.confidence = 0.8;
      intent.detected_entities.urgency_level = message.toLowerCase().includes('urgent') ? 'high' : 'medium';
    }

    // Check for explicit human agent requests
    const humanAgentKeywords = ['human', 'agent', 'person', 'representative'];
    const wantsHuman = humanAgentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (wantsHuman) {
      intent.intent = 'HUMAN_AGENT_REQUEST';
      intent.requires_escalation = true;
      intent.escalation_reason = 'Customer explicitly requested human agent';
      intent.confidence = 0.95;
    }

    console.log('Processed intent:', intent);
    return intent;
  } catch (error) {
    console.error('Error in intent processing:', error);
    // Return a safe default intent if processing fails
    return {
      intent: 'GENERAL_QUERY',
      confidence: 0.5,
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
};
