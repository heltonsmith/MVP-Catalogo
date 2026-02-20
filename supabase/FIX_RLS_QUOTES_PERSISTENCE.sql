-- SQL Script to Fix RLS Policies for Quotes
-- Run this in your Supabase SQL Editor to allow status updates and deletions.

-- 1. Policies for 'quotes' table
DROP POLICY IF EXISTS "Owners can update their store quotes" ON public.quotes;
CREATE POLICY "Owners can update their store quotes" ON public.quotes 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = quotes.company_id 
            AND companies.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can delete their store quotes" ON public.quotes;
CREATE POLICY "Owners can delete their store quotes" ON public.quotes 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = quotes.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- 2. Policies for 'whatsapp_quotes' table
DROP POLICY IF EXISTS "Owners can update their store whatsapp quotes" ON public.whatsapp_quotes;
CREATE POLICY "Owners can update their store whatsapp quotes" ON public.whatsapp_quotes 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = whatsapp_quotes.company_id 
            AND companies.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can delete their store whatsapp quotes" ON public.whatsapp_quotes;
CREATE POLICY "Owners can delete their store whatsapp quotes" ON public.whatsapp_quotes 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = whatsapp_quotes.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- 3. Force schema reload
NOTIFY pgrst, 'reload schema';
