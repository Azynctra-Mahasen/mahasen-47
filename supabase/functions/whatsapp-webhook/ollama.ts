
import { generateGroqSystemPrompt, generateGeminiIntentPrompt } from './prompts.ts';
import { GroqHandler } from './services/model-handlers/groq-handler.ts';
import { GeminiHandler } from './services/model-handlers/gemini-handler.ts';
import { TicketHandler } from './services/ticket-handler.ts';
import { searchKnowledgeBase } from './services/knowledge-base.ts';

export async function generateAIResponse(message: string, context: any, aiSettings: any): Promise<string> {
  try {
    // Initialize Supabase AI Session for embeddings
    const session = new Supabase.ai.Session('gte-small');
    console.log('Generating embedding for user query...');
    
    const embedding = await session.run(message, {
      mean_pool: true,
      normalize: true,
    });

    // Search knowledge base with the embedding
    const knowledgeBaseContext = await searchKnowledgeBase(embedding);
    console.log('Knowledge base context:', knowledgeBaseContext);

    // Update context with knowledge base results
    const updatedContext = {
      ...context,
      knowledgeBase: knowledgeBaseContext || context.knowledgeBase || ''
    };

    if (aiSettings.model_name === 'llama-3.3-70b-versatile') {
      return await generateGroqResponse(message, updatedContext, aiSettings);
    } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await generateGeminiResponse(message, updatedContext, aiSettings);
    } else if (aiSettings.model_name === 'deepseek-r1-distill-llama-70b') {
      return await generateGroqResponse(message, updatedContext, aiSettings);
    } else {
      throw new Error('Invalid model specified');
    }
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw error;
  }
}

async function generateGroqResponse(message: string, context: any, aiSettings: any): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const systemPrompt = generateGroqSystemPrompt({
    knowledgeBase: context.knowledgeBase,
    tone: aiSettings.tone,
    behaviour: aiSettings.behaviour || ''
  });

  try {
    const parsedResponse = await GroqHandler.generateResponse(
      message,
      systemPrompt,
      GROQ_API_KEY,
      aiSettings.model_name
    );

    const ticketResponse = await TicketHandler.handleTicketCreation(parsedResponse, {
      messageId: context.messageId,
      conversationId: context.conversationId,
      userName: context.userName,
      platform: 'whatsapp',
      messageContent: message,
      knowledgeBase: context.knowledgeBase
    });

    if (ticketResponse) {
      return ticketResponse;
    }

    return parsedResponse.response;
  } catch (error) {
    console.error('Error getting Groq response:', error);
    throw error;
  }
}

async function generateGeminiResponse(message: string, context: any, aiSettings: any): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const intentDetectionPrompt = generateGeminiIntentPrompt({
    knowledgeBase: context.knowledgeBase,
    tone: aiSettings.tone,
    behaviour: aiSettings.behaviour
  });

  try {
    const parsedResponse = await GeminiHandler.generateResponse(
      message,
      intentDetectionPrompt,
      GEMINI_API_KEY
    );

    const ticketResponse = await TicketHandler.handleTicketCreation(parsedResponse, {
      messageId: context.messageId,
      conversationId: context.conversationId,
      userName: context.userName,
      platform: 'whatsapp',
      messageContent: message,
      knowledgeBase: context.knowledgeBase
    });

    if (ticketResponse) {
      return ticketResponse;
    }

    return parsedResponse.response;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw error;
  }
}
