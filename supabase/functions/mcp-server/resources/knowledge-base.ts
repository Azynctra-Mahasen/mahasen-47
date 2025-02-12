
import { ResourceTemplate } from "https://esm.sh/@modelcontextprotocol/sdk@1.5.0/server/mcp.js";
import { initSupabase, logger, MCPError } from "../utils.ts";
import { KnowledgeBaseResource } from "../types.ts";

export const knowledgeBaseResource = new ResourceTemplate(
  "kb://{category}/{documentId}",
  { list: "kb://{category}" }
);

export const handleKnowledgeBaseResource = async (
  uri: URL,
  params: { category?: string; documentId?: string }
) => {
  const supabase = initSupabase();
  
  try {
    if (params.documentId) {
      // Single document fetch
      const { data, error } = await supabase
        .from("knowledge_base_files")
        .select("*")
        .eq("id", params.documentId)
        .single();

      if (error) throw error;
      if (!data) throw new MCPError("Document not found", "NOT_FOUND");

      return {
        contents: [{
          uri: uri.href,
          text: data.content,
          metadata: {
            category: data.category,
            lastUpdated: data.created_at,
            ...data.metadata
          }
        }]
      };
    } else {
      // List documents in category
      const query = supabase
        .from("knowledge_base_files")
        .select("*");

      if (params.category && params.category !== "*") {
        query.eq("category", params.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        contents: data.map(doc => ({
          uri: `kb://${doc.category}/${doc.id}`,
          text: doc.content.substring(0, 200) + "...", // Preview only
          metadata: {
            category: doc.category,
            lastUpdated: doc.created_at,
            ...doc.metadata
          }
        }))
      };
    }
  } catch (error) {
    logger.error("Knowledge base resource error:", error);
    throw error;
  }
};
