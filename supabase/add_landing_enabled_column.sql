-- Add landing_enabled column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS landing_enabled BOOLEAN DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN public.companies.landing_enabled IS 'Indicates if the store has enabled the clean landing page mode (hides header/footer)';
