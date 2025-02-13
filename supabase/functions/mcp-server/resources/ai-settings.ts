
import { ResourceTemplate } from "npm:@modelcontextprotocol/sdk@1.5.0";
import { initSupabase, logger, MCPError } from "../utils.ts";
import { AISettingsResource } from "../types.ts";

export const aiSettingsResource = new ResourceTemplate(
  "ai-settings://default",
  { list: undefined }
);

export const handleAISettingsResource = async (uri: URL) => {
  const supabase = initSupabase();
  
  try {
    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    if (!data) throw new MCPError("AI settings not found", "NOT_FOUND");

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          model: data.model_name,
          tone: data.tone,
          contextMemoryLength: data.context_memory_length,
          conversationTimeout: data.conversation_timeout_hours,
          behaviour: data.behaviour
        })
      }]
    };
  } catch (error) {
    logger.error("AI settings resource error:", error);
    throw error;
  }
};
