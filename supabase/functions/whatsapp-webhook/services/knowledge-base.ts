export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  source: 'knowledge_base' | 'product';
  metadata?: {
    title?: string;
    price?: number;
    discounts?: number;
    [key: string]: any;
  };
}

export async function searchKnowledgeBase(query: string): Promise<SearchResult[]> {
  // This is a placeholder for now - we'll implement the actual search later
  return [];
}
