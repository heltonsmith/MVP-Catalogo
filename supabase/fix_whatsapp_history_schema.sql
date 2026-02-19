-- Migration to fix whatsapp_quotes table schema
-- This ensures the table has all necessary columns for the history to be saved correctly.

-- 1. Add missing columns to whatsapp_quotes if they don't exist
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.whatsapp_quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Ensure RLS is enabled
ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;

-- 3. Fix policies for whatsapp_quotes
-- Make sure the user can insert their own history and view it
DROP POLICY IF EXISTS "Users can view own whatsapp history" ON public.whatsapp_quotes;
CREATE POLICY "Users can view own whatsapp history" ON public.whatsapp_quotes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own whatsapp history" ON public.whatsapp_quotes;
CREATE POLICY "Users can insert own whatsapp history" ON public.whatsapp_quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow store owners to see their WhatsApp quotes (though they usually see the 'quotes' table)
DROP POLICY IF EXISTS "Owners can view their store whatsapp quotes" ON public.whatsapp_quotes;
CREATE POLICY "Owners can view their store whatsapp quotes" ON public.whatsapp_quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = whatsapp_quotes.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 4. Grant necessary permissions
GRANT ALL ON public.whatsapp_quotes TO authenticated;
GRANT ALL ON public.whatsapp_quotes TO service_role;
