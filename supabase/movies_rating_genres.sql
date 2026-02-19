-- Add rating and genres to movies table
ALTER TABLE public.movies
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS genres TEXT[],
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;
