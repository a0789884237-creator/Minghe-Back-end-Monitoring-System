-- Add columns for confidentiality agreement and class isolation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Assuming existing update policy for students/teachers allows updating their own profiles
-- No changes needed to RLS if already allowed.
