
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
);

export async function searchKnowledgeBase(embedding: string, userId: string) {
  try {
    // Use the updated function with user_id parameter
    const { data, error } = await supabaseClient.rpc(
      'match_knowledge_base_and_products',
      {
        query_embedding: embedding,
        user_id: userId,
        match_count: 5
      }
    );

    if (error) {
      console.error("Error searching knowledge base:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchKnowledgeBase:", error);
    return [];
  }
}

export async function formatKnowledgeBaseContext(searchResults: any[]) {
  if (!searchResults || searchResults.length === 0) {
    return "";
  }

  try {
    let context = "Here is some helpful information from the knowledge base:\n\n";
    let productContext = "Available products:\n\n";
    
    let hasKnowledgeBase = false;
    let hasProducts = false;

    for (const result of searchResults) {
      if (result.source === 'knowledge_base') {
        hasKnowledgeBase = true;
        context += `${result.content}\n\n`;
      } else if (result.source === 'product') {
        hasProducts = true;
        const price = result.metadata?.price ? `$${result.metadata.price}` : "Price not available";
        const discount = result.metadata?.discounts ? ` (Discount: $${result.metadata.discounts})` : "";
        
        productContext += `- ${result.content}\n   Price: ${price}${discount}\n\n`;
      }
    }

    let finalContext = "";
    if (hasKnowledgeBase) {
      finalContext += context;
    }
    
    if (hasProducts) {
      finalContext += productContext;
    }

    return finalContext.trim();
  } catch (error) {
    console.error("Error formatting knowledge base context:", error);
    return "";
  }
}
