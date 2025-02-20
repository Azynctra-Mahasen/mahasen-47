
import { AISettings } from "./types/intent.ts";

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
  intent: any
): Promise<string | null> {
  try {
    const settings = await getAISettings();
    // For now, return a simple response
    return `Hello ${userName}, thank you for your message. I understand you said: ${userMessage}`;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}
