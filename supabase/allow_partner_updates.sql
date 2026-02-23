-- Allow partners to update status fields (completed, watched, reserved, purchased)
-- This allows any user in a partnership to mark items as done

-- ============================================
-- TODOS - Allow partners to update completed status
-- ============================================
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users and partners can update todos"
ON public.todos FOR UPDATE
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
-- SHOPPING_ITEMS - Allow partners to update purchased status
-- ============================================
DROP POLICY IF EXISTS "Users can update own shopping items" ON public.shopping_items;
CREATE POLICY "Users and partners can update shopping_items"
ON public.shopping_items FOR UPDATE
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
-- MOVIES - Allow partners to update watched status
-- ============================================
DROP POLICY IF EXISTS "Users can update own movies" ON public.movies;
CREATE POLICY "Users and partners can update movies"
ON public.movies FOR UPDATE
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
-- WISHES - Allow partners to update reserved/purchased status
-- ============================================
DROP POLICY IF EXISTS "Users can update own wishes" ON public.wishes;
CREATE POLICY "Users and partners can update wishes"
ON public.wishes FOR UPDATE
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
-- GOALS - Allow partners to update completed status
-- ============================================
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users and partners can update goals"
ON public.goals FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.partnerships
    WHERE status = 'accepted'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND (user_id_1 = user_id OR user_id_2 = user_id)
  )
);
