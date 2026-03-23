-- Add school_name column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Update handle_new_user to sync all organizational fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, school_name, college_name, class_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'college_name',
    NEW.raw_user_meta_data->>'class_name',
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
