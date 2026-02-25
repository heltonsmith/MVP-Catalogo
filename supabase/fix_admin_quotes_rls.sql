-- Migration to allow admins to read all whatsapp_quotes (needed for Observer Mode)
-- Without this, admin observing a client sees 0 quotes because RLS blocks access.

-- 1. Add admin SELECT policy for whatsapp_quotes
DROP POLICY IF EXISTS "Admins can read all whatsapp quotes" ON public.whatsapp_quotes;
CREATE POLICY "Admins can read all whatsapp quotes" ON public.whatsapp_quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );
