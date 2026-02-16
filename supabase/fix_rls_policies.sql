-- 1. Ensure RLS is enabled
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- 2. User SELECT policy: allow users to see their own upgrade requests
-- (based on the company association)
DROP POLICY IF EXISTS "Users can view their own upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Users can view their own upgrade requests" ON public.upgrade_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = upgrade_requests.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 3. Confirm other policies exist/are correct (from previous migrations)
-- Admin ALL policy
DROP POLICY IF EXISTS "Admins can manage all upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Admins can manage all upgrade requests" ON public.upgrade_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- User INSERT policy
DROP POLICY IF EXISTS "Users can create their own upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Users can create their own upgrade requests" ON public.upgrade_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = company_id
            AND companies.user_id = auth.uid()
        )
    );
