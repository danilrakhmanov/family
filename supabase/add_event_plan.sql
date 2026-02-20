-- Add plan column to events table for walk/date schedule
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS plan JSONB DEFAULT '[]';

-- Allow updating plan
-- (RLS policies already allow users to update their own events)
