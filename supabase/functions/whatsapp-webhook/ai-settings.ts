import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AISettings {
  tone: string;
  behaviour: string | null;
  model_name: 'llama3.2:latest' | 'gemini-2.0-flash-exp';
  context_memory_length: number;
  conversation_timeout_hours: number;
}

export async function getAISettings(): Promise<AISettings> {
  console.log('Fetching AI settings...');
  
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching AI settings:', error);
    throw new Error('Failed to fetch AI settings');
  }

  if (!data) {
    console.log('No AI settings found, using defaults');
    return {
      tone: 'Professional',
      behaviour: null,
      model_name: 'llama3.2:latest',
      context_memory_length: 2,
      conversation_timeout_hours: 1
    };
  }

  console.log('AI settings retrieved:', data);
  return data as AISettings;
}