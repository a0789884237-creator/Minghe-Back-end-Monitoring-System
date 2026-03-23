
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  garden_level INTEGER NOT NULL DEFAULT 1,
  total_seeds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Plants table
CREATE TABLE public.plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_type TEXT NOT NULL,
  growth_stage INTEGER NOT NULL DEFAULT 0 CHECK (growth_stage >= 0 AND growth_stage <= 100),
  content TEXT NOT NULL,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  bloom_color TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants" ON public.plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public plants" ON public.plants FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own plants" ON public.plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plants" ON public.plants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plants" ON public.plants FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security inbox table
CREATE TABLE public.security_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT DEFAULT 'unknown',
  security_tips JSONB DEFAULT '[]'::jsonb,
  ai_report JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security items" ON public.security_inbox FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security items" ON public.security_inbox FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own security items" ON public.security_inbox FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own security items" ON public.security_inbox FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_security_inbox_updated_at BEFORE UPDATE ON public.security_inbox
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_plants_user_id ON public.plants(user_id);
CREATE INDEX idx_plants_mood_type ON public.plants(mood_type);
CREATE INDEX idx_plants_is_public ON public.plants(is_public) WHERE is_public = true;
CREATE INDEX idx_security_inbox_user_id ON public.security_inbox(user_id);
CREATE INDEX idx_security_inbox_status ON public.security_inbox(status);
