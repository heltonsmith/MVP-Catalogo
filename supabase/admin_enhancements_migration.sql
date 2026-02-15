-- Add status and plan information to companies if not exists
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL,
ADD COLUMN IF NOT EXISTS subscription_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 month'),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- Ensure user_id has a foreign key if it already existed but wasn't constrained
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'companies' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'companies_user_id_fkey'
    ) THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Add status to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;

-- Create upgrade_requests table
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    requested_plan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Policies for upgrade_requests
DROP POLICY IF EXISTS "Users can create their own upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Users can create their own upgrade requests" ON public.upgrade_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = company_id
            AND companies.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all upgrade requests" ON public.upgrade_requests;
CREATE POLICY "Admins can manage all upgrade requests" ON public.upgrade_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Seed new plan limits into system_config
INSERT INTO public.system_config (key, value, description)
VALUES 
    ('plus_plan_product_limit', '100', 'Máximo de productos permitidos en el plan Plus'),
    ('pro_plan_product_limit', '500', 'Máximo de productos permitidos en el plan Pro'),
    ('plus_plan_image_limit', '5', 'Máximo de imágenes permitidas por producto en el plan Plus'),
    ('pro_plan_image_limit', '5', 'Máximo de imágenes permitidas por producto en el plan Pro')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_upgrade_requests_updated_at ON public.upgrade_requests;
CREATE TRIGGER update_upgrade_requests_updated_at
    BEFORE UPDATE ON public.upgrade_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- quote, stock, chat, message, system
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- In a production app, you might want more restrictive insert rules
