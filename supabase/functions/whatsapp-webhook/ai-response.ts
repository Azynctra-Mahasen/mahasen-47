
import { getContext } from "./services/knowledge-base.ts";

export async function getAIResponse(
  userMessage: string,
  conversationId: string,
  aiSettings: any
) {
  try {
    // Get relevant context from knowledge base
    const context = await getContext(userMessage);
    
    // Use either Gemini or Ollama based on settings
    const modelName = aiSettings?.model_name || 'deepseek-r1-distill-llama-70b';
    
    let response;
    if (modelName.startsWith('gemini')) {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Context: ${context}\n\nUser: ${userMessage}\n\nAssistant: Please provide a helpful response.`
            }]
          }]
        })
      });
    } else {
      response = await fetch(`${Deno.env.get('OLLAMA_BASE_URL')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: `You are a helpful assistant. Use this context if relevant: ${context}` },
            { role: 'user', content: userMessage }
          ],
        })
      });
    }

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return modelName.startsWith('gemini')
      ? data.candidates[0].content.parts[0].text
      : data.message.content;

  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}
