-- 1. Update Profiles table (Role clarification)
-- Rule: 'user' is default, will use 'client' for customers in metadata
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS role_check;
-- Default trigger handle_new_user already sets 'user', we'll override in registration

-- 2. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id uuid NOT NULL, -- can be company_id or product_id
  type text NOT NULL, -- 'retail_store', 'wholesale_store', 'restaurant', 'product'
  user_category text, -- optional custom grouping
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, target_id)
);

-- RLS for Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites 
  FOR ALL USING (auth.uid() = user_id);

-- 3. Link Quotes to customers
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id);

-- Link existing quotes by email if possible (Best effort)
UPDATE public.quotes q
SET customer_id = p.id
FROM public.profiles p
WHERE q.customer_email = p.email AND q.customer_id IS NULL;

-- RLS for Customers to view their own quotes
DROP POLICY IF EXISTS "Customers can view their own quotes" ON public.quotes;
CREATE POLICY "Customers can view their own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = customer_id);

-- 4. Reviews Restrictions
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Constraints to allow only one review per store/product per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_review ON public.reviews (user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_company_review ON public.reviews (user_id, company_id) WHERE company_id IS NOT NULL;

-- Update RLS for Reviews
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews 
  FOR ALL USING (auth.uid() = user_id);
