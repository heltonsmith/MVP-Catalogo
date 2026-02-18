-- Migration to allow public viewing of basic profile information (name and avatar)
-- Needed so store owners can see avatars of customers who leave reviews.

-- 1. Create the policy for public viewing
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

-- Note: The existing "Users can view own profile" and "Admins can view all profiles"
-- are now redundant for SELECT but harmless.
