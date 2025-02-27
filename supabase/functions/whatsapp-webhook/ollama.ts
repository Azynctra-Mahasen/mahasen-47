
import { generateGroqSystemPrompt, generateGeminiIntentPrompt } from './prompts.ts';
import { generateGroqResponse } from './services/model-handlers/groq-handler.ts';
import { GeminiHandler } from './services/model-handlers/gemini-handler.ts';
import { TicketHandler } from './services/ticket-handler.ts';
import { searchKnowledgeBase, formatKnowledgeBaseContext } from './services/knowledge-base.ts';

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
    const searchResults = await searchKnowledgeBase(embedding);
    console.log('Search results:', searchResults);

    // Format knowledge base context
    const formattedContext = await formatKnowledgeBaseContext(searchResults);
    console.log('Formatted context:', formattedContext);

    // Update context with knowledge base results
    const updatedContext = {
      ...context,
      knowledgeBase: formattedContext || context.knowledgeBase || ''
    };

    if (aiSettings.model_name === 'llama-3.3-70b-versatile') {
      return await handleGroqResponse(message, updatedContext, aiSettings);
    } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await handleGeminiResponse(message, updatedContext, aiSettings);
    } else if (aiSettings.model_name === 'deepseek-r1-distill-llama-70b') {
      return await handleGroqResponse(message, updatedContext, aiSettings);
    } else {
      throw new Error('Invalid model specified');
    }
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw error;
  }
}

async function handleGroqResponse(message: string, context: any, aiSettings: any): Promise<string> {
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
    // Format messages for Groq
    const messages = [
      {
        role: "user",
        content: message
      }
    ];
    
    // Call the generateGroqResponse function from the imported module
    const response = await generateGroqResponse(
      messages,
      systemPrompt,
      aiSettings.model_name || 'llama3-70b-8192',
      0.7,
      context.userId
    );
    
    const ticketResponse = await TicketHandler.handleTicketCreation({
      response: response,
      intent: {
        type: "general",
        confidence: 0.9
      }
    }, {
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

    return response;
  } catch (error) {
    console.error('Error getting Groq response:', error);
    throw error;
  }
}

async function handleGeminiResponse(message: string, context: any, aiSettings: any): Promise<string> {
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
