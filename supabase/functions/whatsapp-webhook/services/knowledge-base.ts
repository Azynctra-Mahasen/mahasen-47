import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  source: 'knowledge_base' | 'product';
  metadata: {
    price?: number;
    discounts?: number;
    title?: string;
    product_id?: string;
  };
}

export async function searchKnowledgeBase(
  query_embedding: string, 
  threshold = 0.5, 
  count = 5
): Promise<SearchResult[]> {
  try {
    console.log('Searching knowledge base and products with embedding...');
    
    const { data: matches, error } = await supabase.rpc(
      'match_knowledge_base_and_products',
      {
        query_text: '',
        query_embedding,
        match_count: count,
        full_text_weight: 0.1,
        semantic_weight: 0.9,
        match_threshold: threshold,
        rrf_k: 60
      }
    );

    if (error) {
      console.error('Error searching knowledge base and products:', error);
      return [];
    }

    if (!matches || matches.length === 0) {
      console.log('No relevant matches found in knowledge base or products');
      return [];
    }

    console.log('Found relevant matches:', matches);
    return matches;
  } catch (error) {
    console.error('Error in knowledge base search:', error);
    return [];
  }
}

export async function getExactProduct(productName: string): Promise<SearchResult | null> {
  try {
    console.log('Searching for exact product match:', productName);
    
    const { data: product, error } = await supabase
      .from('products')
      .select('id, title, description, price, discounts')
      .eq('title', productName)
      .single();

    if (error) {
      console.error('Error finding exact product:', error);
      return null;
    }

    if (!product) {
      console.log('No exact product match found');
      return null;
    }

    return {
      id: product.id,
      content: product.description,
      similarity: 1,
      source: 'product',
      metadata: {
        price: product.price,
        discounts: product.discounts,
        title: product.title,
        product_id: product.id
      }
    };
  } catch (error) {
    console.error('Error in exact product search:', error);
    return null;
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  const productResults = results.filter(r => r.source === 'product');
  const knowledgeResults = results.filter(r => r.source === 'knowledge_base');
  
  let formattedContent = '';

  // Format product information first
  if (productResults.length > 0) {
    formattedContent += '--- Available Products ---\n';
    productResults.forEach(product => {
      const price = product.metadata?.price || 0;
      const discount = product.metadata?.discounts || 0;
      const finalPrice = price - (price * (discount / 100));
      
      formattedContent += `${product.metadata?.title}\n`;
      formattedContent += `Price: $${finalPrice.toFixed(2)}`;
      if (discount > 0) {
        formattedContent += ` (${discount}% off from $${price})\n`;
      } else {
        formattedContent += '\n';
      }
      formattedContent += `${product.content}\n\n`;
    });
  }

  // Add knowledge base content
  if (knowledgeResults.length > 0) {
    if (productResults.length > 0) {
      formattedContent += '--- Additional Information ---\n';
    }
    formattedContent += knowledgeResults
      .map(result => result.content)
      .join('\n\n');
  }

  return formattedContent.trim();
}

export function formatKnowledgeBaseContext(searchResults: SearchResult[]): string {
  const productResults = searchResults.filter(r => r.source === 'product');
  const knowledgeResults = searchResults.filter(r => r.source === 'knowledge_base');
  
  let context = '';

  // Format product information first
  if (productResults.length > 0) {
    context += '=== Available Products ===\n';
    productResults.forEach(product => {
      const price = product.metadata?.price || 0;
      const discount = product.metadata?.discounts || 0;
      const finalPrice = price - (price * (discount / 100));
      
      context += `Product: ${product.metadata?.title}\n`;
      context += `Regular Price: $${price.toFixed(2)}\n`;
      if (discount > 0) {
        context += `Discount: ${discount}%\n`;
        context += `Final Price: $${finalPrice.toFixed(2)}\n`;
      }
      context += `Description: ${product.content}\n\n`;
    });
  }

  // Add knowledge base content
  if (knowledgeResults.length > 0) {
    if (productResults.length > 0) {
      context += '=== General Information ===\n';
    }
    context += knowledgeResults
      .map(result => result.content)
      .join('\n\n');
  }

  return context.trim();
}
