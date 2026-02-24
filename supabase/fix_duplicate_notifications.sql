-- Add columns to track last notified states for subscription lifecycle
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS last_notified_renewal_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_downgrade_notified_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN public.companies.last_notified_renewal_date IS 'Tracks the last renewal date for which a grace period notification was sent to avoid duplicates.';
COMMENT ON COLUMN public.companies.last_downgrade_notified_at IS 'Tracks the last time a downgrade notification was sent to avoid duplicates.';
