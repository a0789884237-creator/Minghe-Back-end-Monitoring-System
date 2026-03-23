
-- Knowledge graph: entities and relationships (Zep-style)
CREATE TABLE public.knowledge_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'person',
  attributes jsonb DEFAULT '{}'::jsonb,
  mention_count integer DEFAULT 1,
  last_mentioned_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entities" ON public.knowledge_entities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_entity text NOT NULL,
  target_entity text NOT NULL,
  relation text NOT NULL,
  weight real DEFAULT 1.0,
  context text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own edges" ON public.knowledge_edges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Emotion state tracking (desire-anxiety dual-axis model)
CREATE TABLE public.emotion_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  desire_score real NOT NULL DEFAULT 0.5,
  anxiety_score real NOT NULL DEFAULT 0.5,
  valence real NOT NULL DEFAULT 0.0,
  arousal real NOT NULL DEFAULT 0.0,
  dominant_emotion text NOT NULL DEFAULT 'calm',
  source text DEFAULT 'chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.emotion_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own emotion states" ON public.emotion_states FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add decay_score and last_accessed to user_memories for Mem0-style forgetting
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS decay_score real DEFAULT 1.0;
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0;
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz DEFAULT now();

-- Triggers
CREATE TRIGGER update_knowledge_edges_updated_at BEFORE UPDATE ON public.knowledge_edges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
