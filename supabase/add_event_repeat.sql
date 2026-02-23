-- Add repeat functionality to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none';
