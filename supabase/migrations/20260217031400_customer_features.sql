-- Migration for Customer Panel Features

-- 1. Update profiles table with new customer fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rut text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create store_follows table
CREATE TABLE IF NOT EXISTS public.store_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL DEFAULT 'retail', -- retail, wholesale, mixed, restaurant
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, company_id)
);

-- 3. Create whatsapp_quotes table for history
CREATE TABLE IF NOT EXISTS public.whatsapp_quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL, -- Copy of the WhatsApp message
  total numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.store_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for store_follows
CREATE POLICY "Users can view own follows" ON public.store_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follows" ON public.store_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows" ON public.store_follows
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Policies for whatsapp_quotes
CREATE POLICY "Users can view own whatsapp history" ON public.whatsapp_quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp history" ON public.whatsapp_quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Grant access to public (or as needed)
GRANT ALL ON public.store_follows TO authenticated;
GRANT ALL ON public.whatsapp_quotes TO authenticated;
GRANT ALL ON public.store_follows TO service_role;
GRANT ALL ON public.whatsapp_quotes TO service_role;
