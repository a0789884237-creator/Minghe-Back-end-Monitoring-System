
-- Periodic reports table
CREATE TABLE public.periodic_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add report_frequency preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_frequency TEXT[] DEFAULT '{weekly}'::text[];

-- Enable RLS
ALTER TABLE public.periodic_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own reports" ON public.periodic_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.periodic_reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_periodic_reports_user_type ON public.periodic_reports (user_id, report_type, created_at DESC);
CREATE INDEX idx_periodic_reports_unread ON public.periodic_reports (user_id, is_read) WHERE is_read = false;
