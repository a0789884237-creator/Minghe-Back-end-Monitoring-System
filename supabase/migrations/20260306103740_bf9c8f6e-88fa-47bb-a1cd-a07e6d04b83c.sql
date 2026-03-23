
-- Add life_stage to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_stage text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;

-- Create assessment_results table
CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scale_type text NOT NULL DEFAULT 'phq9',
  total_score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  severity text NOT NULL DEFAULT 'normal',
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assessments"
ON public.assessment_results FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
