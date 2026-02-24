-- Migration to add product visibility toggle
-- Run this in the Supabase SQL Editor

-- 1. Add active column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. Update existing products to be active
UPDATE public.products SET active = TRUE WHERE active IS NULL;

-- 3. Comment: The 'available' column will now be used exclusively for "Disponible/Agotado" (badge only),
-- while 'active' will control whether the product is fetched and shown in the catalog.
