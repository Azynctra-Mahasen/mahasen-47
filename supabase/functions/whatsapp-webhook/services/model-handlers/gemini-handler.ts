
import { ResponseProcessor } from '../response-processor.ts';

export class GeminiHandler {
  static async generateResponse(
    message: string, 
    intentPrompt: string, 
    apiKey: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${intentPrompt}\n\nUser message: ${message}\n\nProvide your analysis and response in the specified JSON format:` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate Gemini response');
      }

      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text.trim();
      return await ResponseProcessor.processAIResponse(responseText);
    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw error;
    }
  }
}
