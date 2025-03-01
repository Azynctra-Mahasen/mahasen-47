
import { getConversationHistory } from "./database.ts";
import { generateAIResponse } from "./ollama.ts";
import { detectIntent } from "./services/intent-processor.ts";
import { formatKnowledgeBaseContext, searchKnowledgeBase } from "./services/knowledge-base.ts";
import { processOrderIntent } from "./services/order-processor.ts";
import { formatResponse } from "./services/response-processor.ts";

export interface MessageContext {
  conversationId: string;
  messageId: string;
  userId: string;
  phoneNumberId: string;
  userName: string;
}

export async function processMessage(message: any, context: MessageContext, aiSettings: any) {
  try {
    console.log(`Processing message from ${context.userName} in conversation ${context.conversationId}`);
    
    // Get message content based on type
    let messageContent = "";
    if (message.type === "text" && message.text) {
      messageContent = message.text.body;
    } else if (message.type === "interactive" && message.interactive) {
      if (message.interactive.type === "button_reply") {
        messageContent = message.interactive.button_reply.title;
      } else if (message.interactive.type === "list_reply") {
        messageContent = message.interactive.list_reply.title;
      }
    } else {
      messageContent = `[Unsupported message type: ${message.type}]`;
    }

    console.log(`Message content: ${messageContent}`);

    // Detect intent
    const intentData = await detectIntent(messageContent);
    console.log("Intent detected:", JSON.stringify(intentData));

    // Handle order intent specifically
    if (intentData.type === "ORDER") {
      return await processOrderIntent(
        messageContent, 
        intentData, 
        context,
        aiSettings
      );
    }

    // Retrieve conversation history using user context
    const conversationHistory = await getConversationHistory(
      context.conversationId,
      context.userId,
      aiSettings.context_memory_length || 2
    );
    console.log(`Retrieved ${conversationHistory.length} messages from history for user ${context.userId}`);

    // Format conversation history for the AI
    const formattedHistory = conversationHistory.map(msg => {
      return {
        role: msg.status === "sent" ? "assistant" : "user",
        content: msg.content
      };
    });

    // Initialize Supabase AI Session for embeddings
    const supabaseAISession = new Supabase.ai.Session('gte-small');
    console.log('Generating embedding for user query...');
    
    const embedding = await supabaseAISession.run(messageContent, {
      mean_pool: true,
      normalize: true,
    });

    // Search knowledge base with user_id filter
    const searchResults = await searchKnowledgeBase(embedding, context.userId);
    console.log(`Knowledge base search returned ${searchResults.length} results for user ${context.userId}`);

    // Format knowledge base context
    const knowledgeBaseContext = await formatKnowledgeBaseContext(searchResults);

    // Generate AI response
    const aiResponseText = await generateAIResponse(
      messageContent,
      {
        history: formattedHistory,
        userName: context.userName,
        conversationId: context.conversationId,
        messageId: context.messageId,
        knowledgeBase: knowledgeBaseContext
      },
      aiSettings
    );

    // Format the response for WhatsApp
    const formattedResponse = formatResponse(aiResponseText, intentData);
    
    return {
      responseText: formattedResponse,
      intentData
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return {
      responseText: "I apologize, but I'm having trouble processing your message right now. Please try again later.",
      intentData: null
    };
  }
}
