-- Fix RLS policies to properly restrict data by user
-- Run this in Supabase SQL Editor

-- ============================================
-- Fix TODOS table RLS
-- ============================================
DROP POLICY IF EXISTS "Todos are viewable by authenticated users" ON public.todos;
CREATE POLICY "Users can view own todos" 
ON public.todos FOR SELECT 
USING (auth.uid() = user_id);

-- ============================================
-- Fix SHOPPING_ITEMS table RLS
-- ============================================
DROP POLICY IF EXISTS "Shopping items are viewable by authenticated users" ON public.shopping_items;
CREATE POLICY "Users can view own shopping items" 
ON public.shopping_items FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update shopping items" ON public.shopping_items;
CREATE POLICY "Users can update own shopping items" 
ON public.shopping_items FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix MOVIES table RLS
-- ============================================
DROP POLICY IF EXISTS "Movies are viewable by authenticated users" ON public.movies;
CREATE POLICY "Users can view own movies" 
ON public.movies FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update movies" ON public.movies;
CREATE POLICY "Users can update own movies" 
ON public.movies FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete movies" ON public.movies;
CREATE POLICY "Users can delete own movies" 
ON public.movies FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix GOALS table RLS
-- ============================================
DROP POLICY IF EXISTS "Goals are viewable by authenticated users" ON public.goals;
CREATE POLICY "Users can view own goals" 
ON public.goals FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update goals" ON public.goals;
CREATE POLICY "Users can update own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete goals" ON public.goals;
CREATE POLICY "Users can delete own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix EXPENSES table RLS
-- ============================================
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;
CREATE POLICY "Users can view own expenses" 
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" 
ON public.expenses FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix EVENTS table RLS
-- ============================================
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
CREATE POLICY "Users can view own events" 
ON public.events FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update events" ON public.events;
CREATE POLICY "Users can update own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete events" ON public.events;
CREATE POLICY "Users can delete own events" 
ON public.events FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix WISHES table RLS
-- ============================================
DROP POLICY IF EXISTS "Wishes are viewable by authenticated users" ON public.wishes;
CREATE POLICY "Users can view own wishes" 
ON public.wishes FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update wishes" ON public.wishes;
CREATE POLICY "Users can update own wishes" 
ON public.wishes FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete wishes" ON public.wishes;
CREATE POLICY "Users can delete own wishes" 
ON public.wishes FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- Fix MEMORIES table RLS
-- ============================================
DROP POLICY IF EXISTS "Memories are viewable by authenticated users" ON public.memories;
CREATE POLICY "Users can view own memories" 
ON public.memories FOR SELECT 
USING (auth.uid() = user_id);
