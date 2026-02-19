-- MASTER MIGRATION: Repair all Quotes, Quote Items and WhatsApp History (REVISADO)
-- This script ensures all tables have the correct columns and RLS policies.
-- Run this in your Supabase SQL Editor.

-- 1. Ensure columns exist in 'quotes' table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_whatsapp text;

-- 2. Ensure columns exist in 'whatsapp_quotes' table
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS content text; -- COLUMNA FALTANTE ANTERIORMENTE
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;

-- 3. Ensure columns exist in 'quote_items' table
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS price_at_time numeric;

-- 4. Enable RLS on all related tables
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;

-- 5. REPAIR POLICIES FOR 'quotes'
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
CREATE POLICY "Anyone can create quotes" ON public.quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view their own quotes" ON public.quotes;
CREATE POLICY "Customers can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Owners can view their store quotes" ON public.quotes;
CREATE POLICY "Owners can view their store quotes" ON public.quotes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = quotes.company_id AND user_id = auth.uid())
);

-- 6. REPAIR POLICIES FOR 'quote_items'
DROP POLICY IF EXISTS "Anyone can create quote items" ON public.quote_items;
CREATE POLICY "Anyone can create quote items" ON public.quote_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view relevant quote items" ON public.quote_items;
CREATE POLICY "Users can view relevant quote items" ON public.quote_items FOR SELECT USING (true);

-- 7. REPAIR POLICIES FOR 'whatsapp_quotes'
DROP POLICY IF EXISTS "Users can view own whatsapp history" ON public.whatsapp_quotes;
CREATE POLICY "Users can view own whatsapp history" ON public.whatsapp_quotes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own whatsapp history" ON public.whatsapp_quotes;
CREATE POLICY "Users can insert own whatsapp history" ON public.whatsapp_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can view their store whatsapp quotes" ON public.whatsapp_quotes;
CREATE POLICY "Owners can view their store whatsapp quotes" ON public.whatsapp_quotes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = whatsapp_quotes.company_id AND user_id = auth.uid())
);

-- 8. Grant permissions
GRANT ALL ON public.quotes TO authenticated, service_role;
GRANT ALL ON public.quote_items TO authenticated, service_role;
GRANT ALL ON public.whatsapp_quotes TO authenticated, service_role;
GRANT ALL ON public.quotes TO anon;
GRANT ALL ON public.quote_items TO anon;

-- 9. Force schema reload (standard Supabase trick)
NOTIFY pgrst, 'reload schema';
