
-- Create HNSW index on counseling_knowledge.embedding for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_counseling_knowledge_embedding_hnsw 
ON public.counseling_knowledge 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Update the search_counseling_knowledge function to use proper cosine similarity
CREATE OR REPLACE FUNCTION public.search_counseling_knowledge(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  question text,
  answer_text text,
  keywords text[],
  strategy_labels text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ck.id,
    ck.question,
    ck.answer_text,
    ck.keywords,
    ck.strategy_labels,
    1 - (ck.embedding <=> query_embedding) AS similarity
  FROM public.counseling_knowledge ck
  WHERE ck.embedding IS NOT NULL
    AND 1 - (ck.embedding <=> query_embedding) > match_threshold
  ORDER BY ck.embedding <=> query_embedding
  LIMIT match_count;
$$;
