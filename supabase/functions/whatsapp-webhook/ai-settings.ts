
import { AISettings, IntentAnalysis } from './types/intent.ts';

export async function getAISettings(): Promise<AISettings> {
  return {
    tone: 'Professional',
    behaviour: null,
    model_name: 'llama-3.3-70b-versatile',
    context_memory_length: 2,
    conversation_timeout_hours: 1
  };
}

export async function generateAIResponse(
  userMessage: string,
  userName: string,
  intent: IntentAnalysis
): Promise<string> {
  const settings = await getAISettings();
  
  // Basic response logic
  if (intent.intent === 'ORDER_PLACEMENT') {
    return `Hello ${userName}, I understand you're interested in placing an order. Could you please confirm the product and quantity you'd like to order?`;
  }
  
  return `Hello ${userName}, thank you for your message. How can I assist you today?`;
}
