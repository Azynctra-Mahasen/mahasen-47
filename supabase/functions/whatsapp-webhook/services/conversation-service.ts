
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getAISettings } from '../ai-settings.ts';
import { generateGroqResponse } from './model-handlers/groq-handler.ts';
import { formatAIResponse } from '../utils/aiResponseFormatter.ts';

interface Message {
  content: string;
  created_at: string;
  sender_name: string;
  sender_number: string;
  status: 'sent' | 'received';
}

export async function fetchConversationContext(
  supabase: any,
  conversationId: string,
  maxMessages: number
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('content, created_at, sender_name, sender_number, status')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(maxMessages);
  
  if (error) {
    console.error('Error fetching conversation context:', error);
    throw error;
  }
  
  // Reverse to get chronological order
  return data.reverse();
}

export async function generateAIResponse(
  messages: Message[],
  systemPrompt: string,
  userId: string
): Promise<string> {
  try {
    // Set up Supabase client for user details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get AI settings
    const aiSettings = await getAISettings(supabase);
    
    // Format messages for the AI model
    const formattedMessages = messages.map(msg => ({
      role: msg.status === 'received' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Generate response using Groq
    const aiResponse = await generateGroqResponse(
      formattedMessages,
      systemPrompt,
      aiSettings.model_name || 'llama3-70b-8192',
      0.7,
      userId
    );
    
    // Format the response
    return formatAIResponse(aiResponse);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}
