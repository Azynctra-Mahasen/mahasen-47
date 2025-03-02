
-- Add the match_knowledge_base_and_products function to the database-functions type
ALTER TYPE "DatabaseFunctions" ADD ATTRIBUTE match_knowledge_base_and_products (
  query_text text,
  query_embedding vector,
  user_id uuid,
  match_count integer,
  full_text_weight double precision,
  semantic_weight double precision,
  match_threshold double precision,
  rrf_k integer
) RETURNS TABLE(id uuid, content text, similarity double precision, source text, metadata jsonb);

-- Add the get_user_by_phone_number_id function to the database-functions type
ALTER TYPE "DatabaseFunctions" ADD ATTRIBUTE get_user_by_phone_number_id (
  phone_id text
) RETURNS uuid;
