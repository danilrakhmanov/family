-- Add repeat functionality to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none';

-- Add CHECK constraint for valid repeat types
ALTER TABLE public.events 
ADD CONSTRAINT valid_repeat_type 
CHECK (repeat_type IS NULL OR repeat_type IN ('none', 'daily', 'every_2_days', 'weekly', 'every_2_weeks', 'monthly', 'yearly'));
