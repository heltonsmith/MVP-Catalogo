-- Fix Popularity Metrics RLS
-- Allow public read access to follower and favorite counts while keeping private data protected

-- 1. Store Follows
DROP POLICY IF EXISTS "Public can view follow counts" ON public.store_follows;
CREATE POLICY "Public can view follow counts" ON public.store_follows
  FOR SELECT USING (true);

-- 2. Favorites
-- We need to separate the SELECT policy to allow anyone to count favorites, 
-- but users should still only manage their own entries.
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can view favorite counts" ON public.favorites;

CREATE POLICY "Anyone can view favorite counts" ON public.favorites
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own favorites" ON public.favorites 
  FOR ALL USING (auth.uid() = user_id);
