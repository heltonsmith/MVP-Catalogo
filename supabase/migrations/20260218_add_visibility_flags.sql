-- Migration to add individual conversation deletion (soft delete)
-- Run this in the Supabase SQL Editor

-- 1. Add visibility columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN DEFAULT TRUE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS visible_to_store BOOLEAN DEFAULT TRUE;

-- 2. Add UPDATE policies (needed for editing and for hiding)
DROP POLICY IF EXISTS "Customers update own messages" ON public.messages;
CREATE POLICY "Customers update own messages" ON public.messages
FOR UPDATE USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Owners update company messages" ON public.messages;
CREATE POLICY "Owners update company messages" ON public.messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = public.messages.company_id
    AND user_id = auth.uid()
  )
);

-- 3. Add DELETE policy (for cleaning up when both hide)
DROP POLICY IF EXISTS "Anyone delete hidden messages" ON public.messages;
CREATE POLICY "Anyone delete hidden messages" ON public.messages
FOR DELETE USING (
  (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = public.messages.company_id
    AND user_id = auth.uid()
  ))
);

-- 4. Update existing SELECT policies to respect visibility
-- We need to drop and recreate them to include the visibility condition
DROP POLICY IF EXISTS "Customers view own messages" ON public.messages;
CREATE POLICY "Customers view own messages" ON public.messages
FOR SELECT USING (auth.uid() = customer_id AND visible_to_customer = TRUE);

DROP POLICY IF EXISTS "Owners view company messages" ON public.messages;
CREATE POLICY "Owners view company messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = public.messages.company_id
    AND user_id = auth.uid()
  ) AND visible_to_store = TRUE
);
