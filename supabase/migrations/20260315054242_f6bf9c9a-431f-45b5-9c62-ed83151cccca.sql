
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text matching (Chinese text backup)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Counseling knowledge base table
CREATE TABLE public.counseling_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  description text,
  answer_text text NOT NULL,
  keywords text[] DEFAULT '{}',
  strategy_labels text[] DEFAULT '{}',
  category text DEFAULT 'general',
  source text DEFAULT 'psyqa',
  embedding vector(768),
  search_text tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(question, '') || ' ' || coalesce(description, '') || ' ' || coalesce(answer_text, ''))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for vector similarity search
CREATE INDEX ON public.counseling_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Index for full-text search
CREATE INDEX ON public.counseling_knowledge USING gin (search_text);

-- Index for keyword search
CREATE INDEX ON public.counseling_knowledge USING gin (keywords);

-- RLS: service role only (no user direct access, accessed via edge functions)
ALTER TABLE public.counseling_knowledge ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (for search)
CREATE POLICY "Anyone can read knowledge" ON public.counseling_knowledge
  FOR SELECT TO authenticated USING (true);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION public.search_counseling_knowledge(
  query_embedding vector(768),
  match_count int DEFAULT 3,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  question text,
  answer_text text,
  keywords text[],
  strategy_labels text[],
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Text-based search function (fallback when no embedding)
CREATE OR REPLACE FUNCTION public.search_counseling_by_text(
  search_query text,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  question text,
  answer_text text,
  keywords text[],
  strategy_labels text[],
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ck.id,
    ck.question,
    ck.answer_text,
    ck.keywords,
    ck.strategy_labels,
    ts_rank(ck.search_text, plainto_tsquery('simple', search_query)) AS rank
  FROM public.counseling_knowledge ck
  WHERE ck.search_text @@ plainto_tsquery('simple', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
$$;
