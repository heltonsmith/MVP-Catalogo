-- Migration to allow admins to manage all reviews
-- Existing policy ONLY allowed users to manage their own reviews.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;

-- 2. Create a policy for users to manage their own reviews
CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = user_id);

-- 3. Create a policy for admins to manage ALL reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );
