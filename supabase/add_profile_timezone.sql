-- Add timezone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Allow users to update their own timezone
CREATE OR REPLACE FUNCTION update_timezone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS and policy for timezone updates
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own timezone" ON profiles;
CREATE POLICY "Users can update own timezone" ON profiles
  FOR UPDATE USING (auth.uid() = id);
