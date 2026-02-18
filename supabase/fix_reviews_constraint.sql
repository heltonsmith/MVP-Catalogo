-- Migration to relax the check constraint on reviews table
-- This allows reviews to be linked to both a product and a company
-- and fixes the conflict when a user reviews multiple products of the same store.

-- 1. Drop the existing target_check constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS target_check;

-- 2. Add the new less restrictive constraint
-- It ensures that at least one of them is set (review must have a target)
-- but allows BOTH to be set simultaneously.
ALTER TABLE public.reviews ADD CONSTRAINT target_check CHECK (
    (product_id IS NOT NULL) OR (company_id IS NOT NULL)
);

-- 3. Fix Unique Constraints/Indexes
-- Drop the restrictive "one review per company" index
DROP INDEX IF EXISTS unique_user_company_review;

-- Add index to allow one General Store Review per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_store_review 
ON public.reviews (user_id, company_id) 
WHERE product_id IS NULL;

-- Add index to allow one Review per Product per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_review 
ON public.reviews (user_id, product_id) 
WHERE product_id IS NOT NULL;
