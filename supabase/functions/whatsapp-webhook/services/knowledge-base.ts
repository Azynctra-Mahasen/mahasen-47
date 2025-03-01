
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";
import { generateEmbedding } from "../ollama.ts";

export interface KnowledgeMatch {
  id: string;
  content: string;
  similarity: number;
  source: string;
  metadata: any;
}

// Fetch matches from the knowledge base
export async function fetchKnowledgeBaseMatches(
  supabase: SupabaseClient<Database>,
  query: string,
  userId: string, // Added userId parameter
  matchCount = 5
): Promise<KnowledgeMatch[]> {
  try {
    // Generate embeddings for the query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      console.log("Failed to generate query embedding");
      return [];
    }

    // Use the updated function that filters by user_id
    const { data: matches, error } = await supabase.rpc(
      "match_knowledge_base_and_products",
      {
        query_text: query,
        query_embedding: queryEmbedding,
        match_count: matchCount,
        user_id: userId // Pass the user_id to ensure proper filtering
      }
    );

    if (error) {
      console.error("Error fetching knowledge base matches:", error);
      return [];
    }

    return matches || [];
  } catch (error) {
    console.error("Exception in fetchKnowledgeBaseMatches:", error);
    return [];
  }
}
