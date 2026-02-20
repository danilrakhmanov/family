-- Add product_url column to wishes table for marketplace links
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS product_url TEXT;
