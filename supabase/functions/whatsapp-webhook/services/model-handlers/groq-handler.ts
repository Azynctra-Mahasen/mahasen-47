
import { ResponseProcessor } from '../response-processor.ts';

export class GroqHandler {
  static async generateResponse(
    message: string, 
    systemPrompt: string, 
    apiKey: string,
    modelName: string
  ): Promise<any> {
    try {
      console.log('Sending request to Groq with message:', message);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName === 'deepseek-r1-distill-llama-70b' ? 
                'deepseek-r1-distill-llama-70b' : 
                'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        throw new Error(`Groq API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content.trim();
      console.log('Raw Groq response:', responseText);
      
      return await ResponseProcessor.processAIResponse(responseText);
    } catch (error) {
      console.error('Error getting Groq response:', error);
      throw error;
    }
  }
}
