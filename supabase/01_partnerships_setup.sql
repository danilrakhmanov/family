-- ============================================
-- PARTNERSHIPS TABLE AND RLS SETUP
-- ============================================

-- Create RPC function to find user by email
CREATE OR REPLACE FUNCTION find_user_by_email(email_text text)
RETURNS TABLE(id uuid, full_name text, avatar_url text) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE u.email = email_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create partnerships table
CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id_1, user_id_2),
  CONSTRAINT no_self_partnership CHECK (user_id_1 != user_id_2),
  CONSTRAINT ordered_users CHECK (user_id_1 < user_id_2)
);

-- Enable RLS on partnerships
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view their own partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can create partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can update their partnerships" ON public.partnerships;

-- RLS Policies for partnerships
CREATE POLICY "Users can view their own partnerships" 
ON public.partnerships FOR SELECT 
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create partnerships" 
ON public.partnerships FOR INSERT 
WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update their partnerships" 
ON public.partnerships FOR UPDATE 
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ============================================
-- UPDATE RLS POLICIES - Include partner's data
-- ============================================

-- TODOS - User can see own todos and partner's todos
DROP POLICY IF EXISTS "Todos are viewable by authenticated users" ON public.todos;

CREATE POLICY "Todos are viewable by user and partner" 
ON public.todos FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- SHOPPING_ITEMS
DROP POLICY IF EXISTS "Shopping items are viewable by authenticated users" ON public.shopping_items;

CREATE POLICY "Shopping items are viewable by user and partner" 
ON public.shopping_items FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- MOVIES
DROP POLICY IF EXISTS "Movies are viewable by authenticated users" ON public.movies;

CREATE POLICY "Movies are viewable by user and partner" 
ON public.movies FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- GOALS
DROP POLICY IF EXISTS "Goals are viewable by authenticated users" ON public.goals;

CREATE POLICY "Goals are viewable by user and partner" 
ON public.goals FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- EXPENSES
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;

CREATE POLICY "Expenses are viewable by user and partner" 
ON public.expenses FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- EVENTS
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;

CREATE POLICY "Events are viewable by user and partner" 
ON public.events FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- WISHES
DROP POLICY IF EXISTS "Wishes are viewable by authenticated users" ON public.wishes;

CREATE POLICY "Wishes are viewable by user and partner" 
ON public.wishes FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);

-- MEMORIES
DROP POLICY IF EXISTS "Memories are viewable by authenticated users" ON public.memories;

CREATE POLICY "Memories are viewable by user and partner" 
ON public.memories FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE status = 'accepted'
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = user_id) OR
      (user_id_2 = auth.uid() AND user_id_1 = user_id)
    )
  )
);
