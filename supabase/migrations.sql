-- OurHome Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. TODOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos are viewable by authenticated users" 
ON public.todos FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert todos" 
ON public.todos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" 
ON public.todos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" 
ON public.todos FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 3. SHOPPING_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  estimated_price DECIMAL(10, 2),
  purchased BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shopping items are viewable by authenticated users" 
ON public.shopping_items FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert shopping items" 
ON public.shopping_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shopping items" 
ON public.shopping_items FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete shopping items" 
ON public.shopping_items FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 4. MOVIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  poster_url TEXT,
  kinopoisk_id TEXT,
  comment TEXT,
  watched BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movies are viewable by authenticated users" 
ON public.movies FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert movies" 
ON public.movies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update movies" 
ON public.movies FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete movies" 
ON public.movies FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 5. GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goals are viewable by authenticated users" 
ON public.goals FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update goals" 
ON public.goals FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete goals" 
ON public.goals FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 6. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses are viewable by authenticated users" 
ON public.expenses FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert expenses" 
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete expenses" 
ON public.expenses FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 7. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  color TEXT DEFAULT '#b8a9a1',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by authenticated users" 
ON public.events FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update events" 
ON public.events FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete events" 
ON public.events FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 8. WISHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price DECIMAL(10, 2),
  priority INTEGER DEFAULT 3,
  comment TEXT,
  image_url TEXT,
  reserved BOOLEAN DEFAULT FALSE,
  purchased BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wishes are viewable by authenticated users" 
ON public.wishes FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert wishes" 
ON public.wishes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update wishes" 
ON public.wishes FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete wishes" 
ON public.wishes FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- 9. MEMORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  image_url TEXT,
  happened_at DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memories are viewable by authenticated users" 
ON public.memories FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert memories" 
ON public.memories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" 
ON public.memories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" 
ON public.memories FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 10. STORAGE BUCKET FOR AVATARS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update an avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete an avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');