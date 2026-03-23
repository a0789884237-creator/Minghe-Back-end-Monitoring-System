-- Case formulation table for dynamic case conceptualization
CREATE TABLE public.case_formulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Core problem hypothesis
  presenting_problems TEXT[] DEFAULT '{}',
  core_beliefs TEXT[] DEFAULT '{}',
  -- CBT cognitive triangle
  automatic_thoughts TEXT[] DEFAULT '{}',
  emotions TEXT[] DEFAULT '{}',
  behaviors TEXT[] DEFAULT '{}',
  -- Factors
  triggering_factors TEXT[] DEFAULT '{}',
  maintaining_factors TEXT[] DEFAULT '{}',
  protective_factors TEXT[] DEFAULT '{}',
  -- Therapeutic direction
  therapy_goals TEXT[] DEFAULT '{}',
  current_stage TEXT NOT NULL DEFAULT 'exploration',
  session_count INTEGER NOT NULL DEFAULT 0,
  -- Progress tracking
  progress_notes TEXT,
  risk_level TEXT DEFAULT 'low',
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.case_formulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own formulation"
  ON public.case_formulations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own formulation"
  ON public.case_formulations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- Service role needs INSERT for edge functions, no user INSERT needed

-- Trigger for updated_at
CREATE TRIGGER update_case_formulations_updated_at
  BEFORE UPDATE ON public.case_formulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();