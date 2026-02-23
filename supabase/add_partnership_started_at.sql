-- Add started_at field to partnerships to track relationship start date
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
