-- Create store_visits table to log individual visits with timestamps
-- This enables period-based filtering (today, 7d, 30d, etc.)

CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast filtering by company + date
CREATE INDEX IF NOT EXISTS idx_store_visits_company_date 
    ON public.store_visits (company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- Handle policies idempotently
DO $$
BEGIN
    -- Drop existing policies if they exist before creating
    DROP POLICY IF EXISTS "Anyone can insert store visits" ON public.store_visits;
    DROP POLICY IF EXISTS "Store owners can view their visits" ON public.store_visits;
END $$;

-- Allow anyone to insert a visit (public catalog visitors aren't logged in)
CREATE POLICY "Anyone can insert store visits"
    ON public.store_visits FOR INSERT
    WITH CHECK (true);

-- Allow store owners to read their own visits
CREATE POLICY "Store owners can view their visits"
    ON public.store_visits FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Allow anon users to insert (visitors)
GRANT INSERT ON public.store_visits TO anon;
GRANT INSERT ON public.store_visits TO authenticated;
GRANT SELECT ON public.store_visits TO authenticated;
