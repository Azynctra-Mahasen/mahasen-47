import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function generateAIResponse(message: string, conversationId: string): Promise<string> {
  try {
    // Get AI settings
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .single();

    if (!aiSettings) {
      throw new Error('AI settings not found');
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(aiSettings.context_memory_length || 5);

    // Format conversation history
    const history = messages
      ?.reverse()
      .map(msg => ({
        role: msg.sender_name === 'AI Assistant' ? 'assistant' : 'user',
        content: msg.content
      })) || [];

    // Add current message
    history.push({ role: 'user', content: message });

    // Generate AI response based on selected model
    if (aiSettings.model_name === 'llama3.2:latest') {
      return await generateOllamaResponse(history, aiSettings);
    } else {
      return await generateGeminiResponse(history, aiSettings);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
}

async function generateOllamaResponse(history: any[], aiSettings: any): Promise<string> {
  const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL');
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:latest',
      messages: history,
      options: {
        temperature: 0.7,
        top_p: 0.9
      },
      system: `You are an AI assistant with a ${aiSettings.tone} tone. ${aiSettings.behaviour || ''}`
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate Ollama response');
  }

  const data = await response.json();
  return data.message.content;
}

async function generateGeminiResponse(history: any[], aiSettings: any): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are an AI assistant with a ${aiSettings.tone} tone. ${aiSettings.behaviour || ''}` }]
        },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate Gemini response');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}