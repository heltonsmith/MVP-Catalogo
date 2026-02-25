-- ==========================================
-- ADMIN DELETE SYSTEM - KTALOOG
-- ==========================================

-- 1. Ensure Cascading Deletes on Core Foreign Keys
-- This ensures that deleting a user or company cleans up all related data automatically.

DO $$ 
BEGIN
    -- COMPANIES -> AUTH.USERS
    -- Usually 'companies' is linked to 'profiles' or directly to 'auth.users'
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_fkey') THEN
        ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
    END IF;
    -- Try to reference profiles first as it's the standard for this app, fallback to auth.users if needed
    ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- PRODUCTS -> COMPANIES
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_company_id_fkey') THEN
        ALTER TABLE public.products DROP CONSTRAINT products_company_id_fkey;
    END IF;
    ALTER TABLE public.products ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

    -- REVIEWS -> PRODUCTS
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_fkey') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_product_id_fkey;
    END IF;
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

    -- REVIEWS -> USERS (user_id)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_fkey;
    END IF;
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- STORE_VISITS -> COMPANIES
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_visits_company_id_fkey') THEN
        ALTER TABLE public.store_visits DROP CONSTRAINT store_visits_company_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_visits') THEN
        ALTER TABLE public.store_visits ADD CONSTRAINT store_visits_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    -- SUPPORT_TICKETS -> PROFILES (user_id)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_user_id_fkey') THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT support_tickets_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- WHATSAPP_QUOTES -> COMPANIES
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_quotes_company_id_fkey') THEN
        ALTER TABLE public.whatsapp_quotes DROP CONSTRAINT whatsapp_quotes_company_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_quotes') THEN
        ALTER TABLE public.whatsapp_quotes ADD CONSTRAINT whatsapp_quotes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

END $$;

-- 2. RPC for deleting a user (from auth.users)
-- This allows admin to completely remove a user from the system.
-- Deleting from auth.users will cascade to public.profiles and then to everything else.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized: Only admins can delete users';
    END IF;

    -- Prevent self-deletion via the admin panel (optional safety)
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminarte a ti mismo';
    END IF;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC for deleting a company only
-- Useful if we want to delete a store but keep the user profile (e.g. they want to start over)
CREATE OR REPLACE FUNCTION public.admin_delete_company(target_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized: Only admins can delete companies';
    END IF;

    DELETE FROM public.companies WHERE id = target_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable DELETE permissions for profiles if not already there (for service role or admin functions)
-- The SECURITY DEFINER on the functions above handles the actual deletion with superuser privileges.
