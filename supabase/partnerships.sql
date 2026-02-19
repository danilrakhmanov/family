-- Add partnerships table and fix RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- PARTNERSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id_1, user_id_2),
  CONSTRAINT no_self_partnership CHECK (user_id_1 != user_id_2)
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

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
-- FIX TODOS RLS - only visible to user and their partner
-- ============================================
DROP POLICY IF EXISTS "Todos are viewable by authenticated users" ON public.todos;
CREATE POLICY "Users can view their todos and partner's todos" 
ON public.todos FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

-- ============================================
-- FIX SHOPPING_ITEMS RLS
-- ============================================
DROP POLICY IF EXISTS "Shopping items are viewable by authenticated users" ON public.shopping_items;
CREATE POLICY "Users can view their shopping items and partner's" 
ON public.shopping_items FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can update shopping items" ON public.shopping_items;
CREATE POLICY "Users can update own shopping items" 
ON public.shopping_items FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete shopping items" ON public.shopping_items;
CREATE POLICY "Users can delete own shopping items" 
ON public.shopping_items FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX MOVIES RLS
-- ============================================
DROP POLICY IF EXISTS "Movies are viewable by authenticated users" ON public.movies;
CREATE POLICY "Users can view their movies and partner's" 
ON public.movies FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can update movies" ON public.movies;
CREATE POLICY "Users can update own movies" 
ON public.movies FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete movies" ON public.movies;
CREATE POLICY "Users can delete own movies" 
ON public.movies FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX WISHES RLS
-- ============================================
DROP POLICY IF EXISTS "Wishes are viewable by authenticated users" ON public.wishes;
CREATE POLICY "Users can view their wishes and partner's" 
ON public.wishes FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can update wishes" ON public.wishes;
CREATE POLICY "Users can update own wishes" 
ON public.wishes FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete wishes" ON public.wishes;
CREATE POLICY "Users can delete own wishes" 
ON public.wishes FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX MEMORIES RLS
-- ============================================
DROP POLICY IF EXISTS "Memories are viewable by authenticated users" ON public.memories;
CREATE POLICY "Users can view their memories and partner's" 
ON public.memories FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

-- ============================================
-- FIX GOALS RLS
-- ============================================
DROP POLICY IF EXISTS "Goals are viewable by authenticated users" ON public.goals;
CREATE POLICY "Users can view their goals and partner's" 
ON public.goals FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can update goals" ON public.goals;
CREATE POLICY "Users can update own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete goals" ON public.goals;
CREATE POLICY "Users can delete own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX EXPENSES RLS
-- ============================================
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;
CREATE POLICY "Users can view their expenses and partner's" 
ON public.expenses FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" 
ON public.expenses FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX EVENTS RLS
-- ============================================
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
CREATE POLICY "Users can view their events and partner's" 
ON public.events FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships 
    WHERE (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
    AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Users can update events" ON public.events;
CREATE POLICY "Users can update own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete events" ON public.events;
CREATE POLICY "Users can delete own events" 
ON public.events FOR DELETE 
USING (auth.uid() = user_id);
