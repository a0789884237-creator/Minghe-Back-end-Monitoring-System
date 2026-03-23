
-- Prompt version management table
CREATE TABLE public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  prompt_type text NOT NULL DEFAULT 'chat_system',
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  ab_weight real NOT NULL DEFAULT 0.0,
  metadata jsonb DEFAULT '{}'::jsonb,
  quality_score real DEFAULT NULL,
  total_feedback integer NOT NULL DEFAULT 0,
  positive_feedback integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access, authenticated users read-only
CREATE POLICY "Anyone can read active prompts"
  ON public.prompt_versions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Chat feedback table for user ratings
CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  message_index integer NOT NULL,
  rating text NOT NULL CHECK (rating IN ('like', 'dislike')),
  feedback_text text DEFAULT NULL,
  prompt_version_id uuid REFERENCES public.prompt_versions(id) DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.chat_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.chat_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Question bank table for structured assessment questions
CREATE TABLE public.question_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_stage text NOT NULL,
  category text NOT NULL,
  primary_question text NOT NULL,
  follow_up_questions text[] DEFAULT '{}',
  priority integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions"
  ON public.question_banks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Quality evaluation results
CREATE TABLE public.response_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  message_index integer NOT NULL,
  empathy_score real DEFAULT 0,
  professionalism_score real DEFAULT 0,
  safety_score real DEFAULT 0,
  memory_utilization real DEFAULT 0,
  overall_score real DEFAULT 0,
  evaluation_details jsonb DEFAULT '{}'::jsonb,
  prompt_version_id uuid REFERENCES public.prompt_versions(id) DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.response_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages evaluations"
  ON public.response_evaluations FOR ALL
  TO authenticated
  USING (true);
