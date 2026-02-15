-- Fix for missing company_id in quotes table
-- Run this in Supabase SQL Editor

-- 1. Add company_id column if it doesn't exist
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON public.quotes(company_id);

-- 3. Update RLS policy to ensure it uses the new column
-- Drop potentially conflicting or invalid policies first
DROP POLICY IF EXISTS "Owners view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Owners view quotes" ON public.quotes;

-- Re-create the policy covering company owners
CREATE POLICY "Owners view own quotes" ON public.quotes
FOR SELECT USING (
  exists (
    select 1 from public.companies 
    where id = public.quotes.company_id 
    and user_id = auth.uid()
  )
);

-- 4. If you have existing quotes without company_id, you might want to try to infer it 
-- from items (if quote_items exist), otherwise they will remain orphaned (null)
-- or you can manually update them.
/*
UPDATE public.quotes q
SET company_id = (
  SELECT p.company_id 
  FROM public.quote_items qi
  JOIN public.products p ON qi.product_id = p.id
  WHERE qi.quote_id = q.id
  LIMIT 1
)
WHERE q.company_id IS NULL;
*/
