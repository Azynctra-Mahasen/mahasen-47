
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { IntentAnalysis } from './types/intent.ts';

export interface AISettings {
  tone: string;
  behaviour: string | null;
  model_name: string;
  context_memory_length: number;
  conversation_timeout_hours: number;
}

export async function getAISettings(): Promise<AISettings> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching AI settings:', error);
    return {
      tone: 'Professional',
      behaviour: null,
      model_name: 'groq-llama-3.3-70b-versatile',
      context_memory_length: 2,
      conversation_timeout_hours: 1
    };
  }

  return data as AISettings;
}

export async function generateAIResponse(
  userMessage: string,
  userName: string,
  intent: IntentAnalysis
): Promise<string> {
  try {
    const settings = await getAISettings();
    console.log('Using AI settings:', settings);

    // Check if it's an order-related message
    if (intent.intent === 'ORDER_PLACEMENT') {
      const orderInfo = intent.detected_entities.order_info;
      
      if (!orderInfo || !orderInfo.products.length) {
        return `Hello ${userName}, I understand you want to place an order. Could you please specify the product and quantity you'd like to order?`;
      }
      
      const product = orderInfo.products[0];
      if (product.title) {
        return `Hello ${userName}, I see you're interested in ${product.title}. How many would you like to order?`;
      }
    }

    // Default response based on AI settings tone
    const greeting = settings.tone === 'Professional' ? 
      `Hello ${userName}, thank you for your message.` : 
      `Hi ${userName}! Thanks for reaching out!`;

    return `${greeting} How can I assist you today?`;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Hello ${userName}, thank you for your message. How can I assist you today?`;
  }
}
