
-- Update the match_knowledge_base_and_products function to properly filter by user_id
CREATE OR REPLACE FUNCTION public.match_knowledge_base_and_products(
  query_text text,
  query_embedding vector,
  user_id uuid,
  match_count integer DEFAULT 5,
  full_text_weight double precision DEFAULT 0.1,
  semantic_weight double precision DEFAULT 0.9,
  match_threshold double precision DEFAULT 0.5,
  rrf_k integer DEFAULT 60
)
RETURNS TABLE(id uuid, content text, similarity double precision, source text, metadata jsonb)
LANGUAGE sql
STABLE
AS $$
  WITH combined_results AS (
    -- Query knowledge base files with user_id filter
    SELECT 
      id,
      content,
      1 - (embedding <=> query_embedding) as cosine_similarity,
      'knowledge_base' as source,
      jsonb_build_object() as metadata,
      ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) as rank_ix
    FROM knowledge_base_files
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    AND user_id = match_knowledge_base_and_products.user_id
    
    UNION ALL
    
    -- Query products with user_id filter
    SELECT 
      id,
      title || E'\n' || description as content,
      1 - (embedding <=> query_embedding) as cosine_similarity,
      'product' as source,
      jsonb_build_object(
        'price', price,
        'discounts', discounts,
        'title', title
      ) as metadata,
      ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) as rank_ix
    FROM products
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    AND embedding_status = 'completed'
    AND user_id = match_knowledge_base_and_products.user_id
  )
  SELECT
    cr.id,
    cr.content,
    cr.cosine_similarity as similarity,
    cr.source,
    cr.metadata
  FROM combined_results cr
  ORDER BY 
    cosine_similarity DESC,
    rank_ix ASC
  LIMIT match_count;
$$;

-- Create the function to get user ID from phone number ID
CREATE OR REPLACE FUNCTION public.get_user_by_phone_number_id(phone_id text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT user_id INTO found_user_id
  FROM platform_secrets
  WHERE whatsapp_phone_id = phone_id;
  
  RETURN found_user_id;
END;
$$;
