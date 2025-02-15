
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function searchKnowledgeBase(embedding: number[]) {
  try {
    // First search in knowledge base files
    const { data: filesData, error: filesError } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5
      }
    );

    if (filesError) throw filesError;

    // Search in products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('embedding', 'is', null);

    if (productsError) throw productsError;

    // Format products data
    const productsContext = productsData.map(product => 
      `Product: ${product.title}\nDescription: ${product.description}\nPrice: $${product.price}${product.discounts ? `\nDiscount: $${product.discounts}` : ''}`
    ).join('\n\n');

    // Combine both contexts
    const filesContext = filesData.map(file => file.content).join('\n\n');
    const combinedContext = [
      filesContext,
      'Available Products:',
      productsContext
    ].filter(Boolean).join('\n\n');

    console.log('Combined knowledge base context:', combinedContext);
    return combinedContext;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return null;
  }
}
