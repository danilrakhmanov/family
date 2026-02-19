-- Исправление: Обновление внешних ключей и политик безопасности RLS

-- ============================================
-- ШАГ 1: Обновление внешних ключей с auth.users на таблицу profiles
-- ============================================
-- Процедура:
-- 1. Удаляем старую ссылку на auth.users
-- 2. Добавляем новую ссылку на profiles для каждой таблицы
-- 3. Это позволит использовать join синтаксис Supabase: profiles:user_id()

-- Задачи (todos): Обновляем связь на таблицу profiles
ALTER TABLE public.todos
DROP CONSTRAINT IF EXISTS todos_user_id_fkey;

ALTER TABLE public.todos
ADD CONSTRAINT todos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Shopping Items: Similar change
ALTER TABLE public.shopping_items
DROP CONSTRAINT IF EXISTS shopping_items_user_id_fkey;

ALTER TABLE public.shopping_items
ADD CONSTRAINT shopping_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Movies
ALTER TABLE public.movies
DROP CONSTRAINT IF EXISTS movies_user_id_fkey;

ALTER TABLE public.movies
ADD CONSTRAINT movies_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Goals
ALTER TABLE public.goals
DROP CONSTRAINT IF EXISTS goals_user_id_fkey;

ALTER TABLE public.goals
ADD CONSTRAINT goals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Expenses
ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

ALTER TABLE public.expenses
ADD CONSTRAINT expenses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Events
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_user_id_fkey;

ALTER TABLE public.events
ADD CONSTRAINT events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Wishes
ALTER TABLE public.wishes
DROP CONSTRAINT IF EXISTS wishes_user_id_fkey;

ALTER TABLE public.wishes
ADD CONSTRAINT wishes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Memories
ALTER TABLE public.memories
DROP CONSTRAINT IF EXISTS memories_user_id_fkey;

ALTER TABLE public.memories
ADD CONSTRAINT memories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- ============================================
-- FIX TODOS
-- ============================================
DROP POLICY IF EXISTS "Todos are viewable by authenticated users" ON public.todos;
DROP POLICY IF EXISTS "Users can view their todos and partner's todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

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
-- FIX SHOPPING_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Shopping items are viewable by authenticated users" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can view their shopping items and partner's" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can insert shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can update shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can update own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can delete shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can delete own shopping items" ON public.shopping_items;

CREATE POLICY "Shopping items are viewable by authenticated users" 
ON public.shopping_items FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert shopping items" 
ON public.shopping_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping items" 
ON public.shopping_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping items" 
ON public.shopping_items FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX MOVIES
-- ============================================
DROP POLICY IF EXISTS "Movies are viewable by authenticated users" ON public.movies;
DROP POLICY IF EXISTS "Users can view their movies and partner's" ON public.movies;
DROP POLICY IF EXISTS "Users can insert movies" ON public.movies;
DROP POLICY IF EXISTS "Users can update movies" ON public.movies;
DROP POLICY IF EXISTS "Users can update own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can delete movies" ON public.movies;
DROP POLICY IF EXISTS "Users can delete own movies" ON public.movies;

CREATE POLICY "Movies are viewable by authenticated users" 
ON public.movies FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert movies" 
ON public.movies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies" 
ON public.movies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies" 
ON public.movies FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX WISHES
-- ============================================
DROP POLICY IF EXISTS "Wishes are viewable by authenticated users" ON public.wishes;
DROP POLICY IF EXISTS "Users can view their wishes and partner's" ON public.wishes;
DROP POLICY IF EXISTS "Users can insert wishes" ON public.wishes;
DROP POLICY IF EXISTS "Users can update wishes" ON public.wishes;
DROP POLICY IF EXISTS "Users can update own wishes" ON public.wishes;
DROP POLICY IF EXISTS "Users can delete wishes" ON public.wishes;
DROP POLICY IF EXISTS "Users can delete own wishes" ON public.wishes;

CREATE POLICY "Wishes are viewable by authenticated users" 
ON public.wishes FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert wishes" 
ON public.wishes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishes" 
ON public.wishes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishes" 
ON public.wishes FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX MEMORIES
-- ============================================
DROP POLICY IF EXISTS "Memories are viewable by authenticated users" ON public.memories;
DROP POLICY IF EXISTS "Users can view their memories and partner's" ON public.memories;
DROP POLICY IF EXISTS "Users can insert memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;

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
-- FIX GOALS
-- ============================================
DROP POLICY IF EXISTS "Goals are viewable by authenticated users" ON public.goals;
DROP POLICY IF EXISTS "Users can view their goals and partner's" ON public.goals;
DROP POLICY IF EXISTS "Users can insert goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

CREATE POLICY "Goals are viewable by authenticated users" 
ON public.goals FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX EXPENSES
-- ============================================
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Users can view their expenses and partner's" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Expenses are viewable by authenticated users" 
ON public.expenses FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert expenses" 
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
ON public.expenses FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FIX EVENTS
-- ============================================
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Users can view their events and partner's" ON public.events;
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

CREATE POLICY "Events are viewable by authenticated users" 
ON public.events FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" 
ON public.events FOR DELETE 
USING (auth.uid() = user_id);

