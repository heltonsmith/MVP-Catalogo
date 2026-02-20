-- Add whatsapp_enabled column to companies table
-- This allows store owners to temporarily disconnect WhatsApp quotes 
-- without deleting their WhatsApp number from the system.

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT true;

-- Update RLS policies if necessary (usually not needed if just a new column, 
-- but ensuring owners can update it)
-- Owners can already update their company record usually.
