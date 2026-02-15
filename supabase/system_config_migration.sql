-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to system_config" ON public.system_config
    FOR SELECT USING (true);

-- Allow admins to update system_config
CREATE POLICY "Allow admins to update system_config" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Seed initial values
INSERT INTO public.system_config (key, value, description)
VALUES 
    ('free_plan_product_limit', '5', 'Máximo de productos permitidos en el plan gratuito'),
    ('free_plan_image_limit', '1', 'Máximo de imágenes permitidas por producto en el plan gratuito')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;
