
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../_shared/database.types.ts";
import { AISettingsType } from "./types/ai-settings.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Default AI settings in case none are found
const defaultAISettings: AISettingsType = {
  model: "gemini-pro",
  tone: "professional",
  behavior: "You are a helpful AI assistant for a business. Answer questions accurately and professionally.",
  context_memory: "recent",
  conversation_timeout: 60,
};

export async function getAISettings(userId: string): Promise<AISettingsType> {
  try {
    // Get AI settings for the specific user
    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.warn(`AI settings not found for user ${userId}, using defaults`);
      return defaultAISettings;
    }

    return {
      model: data.model || defaultAISettings.model,
      tone: data.tone || defaultAISettings.tone,
      behavior: data.behavior || defaultAISettings.behavior,
      context_memory: data.context_memory || defaultAISettings.context_memory,
      conversation_timeout: data.conversation_timeout || defaultAISettings.conversation_timeout,
    };
  } catch (error) {
    console.error("Error retrieving AI settings:", error);
    return defaultAISettings;
  }
}
