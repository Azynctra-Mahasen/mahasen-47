
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../../_shared/database.types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function getKnowledgeBaseContext(query: string, userId: string) {
  try {
    // Generate an embedding for the query
    const embeddingResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ text: query }),
    });

    if (!embeddingResponse.ok) {
      console.error("Failed to generate embedding:", await embeddingResponse.text());
      return [];
    }

    const { embedding } = await embeddingResponse.json();

    // Query knowledge base files for the specific user
    const { data: knowledgeBaseFiles, error: kbError } = await supabase
      .from("knowledge_base_files")
      .select("id, content, embedding")
      .eq("user_id", userId)
      .limit(5);

    if (kbError) {
      console.error("Error querying knowledge base:", kbError);
      return [];
    }

    // Calculate similarity scores
    const knowledgeBaseResults = knowledgeBaseFiles
      ? knowledgeBaseFiles.map((file) => ({
          id: file.id,
          content: file.content,
          similarity: cosineSimilarity(embedding, file.embedding),
          source: "knowledge_base",
          metadata: {},
        }))
      : [];

    // Query products for the specific user
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, description, price, discounts, embedding")
      .eq("user_id", userId)
      .eq("embedding_status", "completed")
      .limit(5);

    if (productsError) {
      console.error("Error querying products:", productsError);
      return knowledgeBaseResults;
    }

    // Calculate similarity scores for products
    const productResults = products
      ? products.map((product) => ({
          id: product.id,
          content: `${product.title}\n${product.description}`,
          similarity: cosineSimilarity(embedding, product.embedding),
          source: "product",
          metadata: {
            price: product.price,
            discounts: product.discounts,
            title: product.title,
          },
        }))
      : [];

    // Combine and sort results by similarity
    const combinedResults = [...knowledgeBaseResults, ...productResults]
      .filter((item) => item.similarity > 0.7) // Threshold for relevance
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Get top 5 results

    return combinedResults;
  } catch (error) {
    console.error("Error getting knowledge base context:", error);
    return [];
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
