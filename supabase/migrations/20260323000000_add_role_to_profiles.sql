-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Set first user as admin (optional but helpful for development)
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);
