-- Migration to fix RLS policies for quotes and quote_items
-- This allows guests and registered customers to send quotes correctly.

-- 1. Ensure RLS is enabled
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- 2. Allow PUBLIC INSERT (Guests)
-- This is necessary because users can shop without logging in
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
CREATE POLICY "Anyone can create quotes" ON public.quotes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create quote items" ON public.quote_items;
CREATE POLICY "Anyone can create quote items" ON public.quote_items
    FOR INSERT WITH CHECK (true);

-- 3. Allow customers to see their own quotes
-- We use customer_id column added in previous migrations
DROP POLICY IF EXISTS "Customers can view their own quotes" ON public.quotes;
CREATE POLICY "Customers can view their own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = customer_id);

-- 4. Allow store owners to see quotes for their companies
DROP POLICY IF EXISTS "Owners can view their store quotes" ON public.quotes;
CREATE POLICY "Owners can view their store quotes" ON public.quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = quotes.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 5. Allow admins to see everything
DROP POLICY IF EXISTS "Admins can manage all quotes" ON public.quotes;
CREATE POLICY "Admins can manage all quotes" ON public.quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- 6. Grant access to quote_items based on quote visibility
DROP POLICY IF EXISTS "Users can view relevant quote items" ON public.quote_items;
CREATE POLICY "Users can view relevant quote items" ON public.quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes
            WHERE quotes.id = quote_items.quote_id
        )
    );
