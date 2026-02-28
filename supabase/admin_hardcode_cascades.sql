-- ==========================================
-- MANUAL CASCADE DELETES FIX
-- ==========================================
-- The dynamic script might miss constraints crossing the auth schema 
-- depending on role privileges. This script explicitly drops and recreates
-- all known foreign keys mapping to auth.users and public.profiles 
-- to ensure ON DELETE CASCADE is applied everywhere.

DO $$ 
BEGIN

    -- 1. QUOTES Table (The one failing)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_customer_id_fkey') THEN
        ALTER TABLE public.quotes DROP CONSTRAINT quotes_customer_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
        ALTER TABLE public.quotes ADD CONSTRAINT quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_company_id_fkey') THEN
        ALTER TABLE public.quotes DROP CONSTRAINT quotes_company_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
        ALTER TABLE public.quotes ADD CONSTRAINT quotes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    -- 2. NOTIFICATIONS Table
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Check if it references profiles or auth.users
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='user_id') THEN
            -- In previous scripts we referenced public.profiles, let's use auth.users as fallback or just try profiles
            -- Wait, notifications user_id usually maps to users or profiles. Let's map to profiles, but auth.users is safer
            -- For KTALOOG, notifications.user_id references public.profiles(id) in fix_all_db_issues.sql
            ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- 3. FAVORITES Table
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_fkey') THEN
        ALTER TABLE public.favorites DROP CONSTRAINT favorites_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 4. STORE_FOLLOWS Table
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_follows_user_id_fkey') THEN
        ALTER TABLE public.store_follows DROP CONSTRAINT store_follows_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_follows') THEN
        ALTER TABLE public.store_follows ADD CONSTRAINT store_follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 5. MESSAGES Table
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_customer_id_fkey') THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_customer_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_company_id_fkey') THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_company_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    -- 6. PROFILES Table (the link to auth.users itself)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

END $$;
