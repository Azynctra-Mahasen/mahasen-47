
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";
import { KnowledgeMatch } from "./knowledge-base.ts";
import { AISettings } from "../types/ai-settings.ts";
import { getGeminiResponse } from "../ai-models/gemini.ts";
import { getGroqResponse } from "../services/model-handlers/groq-handler.ts";
import { getConversationContext } from "./conversation-service.ts";
import { formatAIResponse } from "../utils/aiResponseFormatter.ts";

export async function generateAIResponse(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  userMessage: string,
  knowledgeMatches: KnowledgeMatch[],
  aiSettings: AISettings,
  userId: string // Added userId parameter
): Promise<string> {
  try {
    // Get the conversation context limited to this user's conversations
    const context = await getConversationContext(
      supabase, 
      conversationId, 
      aiSettings.context_memory_length || 2,
      userId // Pass userId for proper filtering
    );

    let response = "";

    // Use the appropriate AI model based on settings
    switch (aiSettings.model_name) {
      case "gemini-2.0-flash-exp":
        response = await getGeminiResponse(
          userMessage,
          context,
          knowledgeMatches,
          aiSettings
        );
        break;
      case "groq-llama-3.3-70b-versatile":
        response = await getGroqResponse(
          userMessage,
          context,
          knowledgeMatches,
          aiSettings
        );
        break;
      default:
        // Default to a simple response if models are unavailable
        response = "I'm sorry, but I'm having trouble accessing my AI capabilities right now. Please try again later.";
    }

    // Format the response according to platform guidelines
    const formattedResponse = formatAIResponse(response, "whatsapp");

    return formattedResponse;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I apologize, but I encountered an error while processing your request. Please try again.";
  }
}
