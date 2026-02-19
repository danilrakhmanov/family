-- Allow users to update their own partnerships
CREATE POLICY "Allow users to update own partnerships"
ON partnerships
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id_1 OR auth.uid() = user_id_2
);

-- Allow users to delete their own partnerships
CREATE POLICY "Allow users to delete own partnerships"
ON partnerships
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id_1 OR auth.uid() = user_id_2
);

-- Allow users to read their own partnerships
CREATE POLICY "Allow users to read own partnerships"
ON partnerships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_1 OR auth.uid() = user_id_2
);

-- Allow users to insert partnerships
CREATE POLICY "Allow users to create partnerships"
ON partnerships
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_1 OR auth.uid() = user_id_2
);
