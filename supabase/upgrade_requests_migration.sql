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
-- Authenticated users can create requests for their own companies
CREATE POLICY "Users can create their own upgrade requests" ON public.upgrade_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage all upgrade requests" ON public.upgrade_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_upgrade_requests_updated_at
    BEFORE UPDATE ON public.upgrade_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
