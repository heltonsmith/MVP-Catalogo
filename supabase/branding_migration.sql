-- Add branding_settings column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS branding_settings jsonb DEFAULT '{
  "banner": {"x": 50, "y": 50, "zoom": 100},
  "logo": {"x": 50, "y": 50, "zoom": 100}
}'::jsonb;
