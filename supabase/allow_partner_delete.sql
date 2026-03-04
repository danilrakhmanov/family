-- Allow partners to delete records
-- This allows any user in a partnership to delete items

-- ============================================
-- TODOS - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users and partners can delete todos"
ON public.todos FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- SHOPPING_ITEMS - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own shopping items" ON public.shopping_items;
CREATE POLICY "Users and partners can delete shopping_items"
ON public.shopping_items FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- MOVIES - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own movies" ON public.movies;
CREATE POLICY "Users and partners can delete movies"
ON public.movies FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- WISHLIST (wishes) - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own wishes" ON public.wishes;
CREATE POLICY "Users and partners can delete wishes"
ON public.wishes FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- GOALS - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users and partners can delete goals"
ON public.goals FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- MEMORIES - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;
CREATE POLICY "Users and partners can delete memories"
ON public.memories FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- EXPENSES (finance) - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users and partners can delete expenses"
ON public.expenses FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);

-- ============================================
-- EVENTS - Allow partners to delete
-- ============================================
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
CREATE POLICY "Users and partners can delete events"
ON public.events FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);
