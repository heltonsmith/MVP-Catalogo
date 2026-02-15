-- Real-time Messaging System Schema

-- 1. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('customer', 'store')) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Customer Policies
-- View their own messages
CREATE POLICY "Customers view own messages" ON public.messages
FOR SELECT USING (auth.uid() = customer_id);

-- Insert messages as themselves
CREATE POLICY "Customers insert messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = customer_id AND sender_type = 'customer');

-- Store Owner Policies
-- View messages for their companies
CREATE POLICY "Owners view company messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = public.messages.company_id
    AND user_id = auth.uid()
  )
);

-- Reply to messages (insert as store)
CREATE POLICY "Owners reply to messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_type = 'store' AND
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = public.messages.company_id
    AND user_id = auth.uid()
  )
);

-- 4. Enable Realtime
-- Note: This usually needs to be done via dashboard or API, but SQL can trigger it if replication is set up.
-- For Supabase specifically:
alter publication supabase_realtime add table public.messages;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_company_customer ON public.messages(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
