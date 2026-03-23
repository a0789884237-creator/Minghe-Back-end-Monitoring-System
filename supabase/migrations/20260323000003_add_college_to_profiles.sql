-- Add college_name column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT;

-- Update handle_new_user to sync college_name from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, class_name, college_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'class_name',
    NEW.raw_user_meta_data->>'college_name',
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
