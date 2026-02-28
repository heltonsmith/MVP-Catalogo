-- ==========================================
-- ADMIN FIX CASCADING DELETES
-- ==========================================
-- This script dynamically finds ALL foreign keys that reference 
-- auth.users, public.profiles, or public.companies
-- and forces them to use ON DELETE CASCADE.
-- This guarantees that the admin_delete_user function will never fail
-- with a 409 Conflict due to restricted foreign keys.

DO $$ 
DECLARE 
    r RECORD;
    v_sql TEXT;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_schema,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
        FROM 
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          -- We only want to target foreign keys pointing to these master tables
          AND ccu.table_name IN ('users', 'profiles', 'companies', 'products')
          AND ccu.table_schema IN ('auth', 'public')
          -- Safety exclusion: do not modify Supabase internal auth relations
          AND tc.table_schema NOT IN ('auth', 'storage', 'pgsodium', 'supabase_functions')
    ) LOOP
        -- Build the DROP and ADD constraint query
        v_sql := format(
            'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I; ' ||
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE CASCADE;',
            r.table_schema, r.table_name, r.constraint_name,
            r.table_schema, r.table_name, r.constraint_name, r.column_name, r.foreign_schema, r.foreign_table, r.foreign_column
        );
        
        -- Execute the dynamic SQL
        EXECUTE v_sql;
        RAISE NOTICE 'Updated constraint % on table % to ON DELETE CASCADE', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Also verify the delete unctions are correctly defined
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Not authorized: Only admins can delete users';
    END IF;

    -- Prevent self-deletion via the admin panel
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminarte a ti mismo';
    END IF;

    -- Delete from auth.users (cascades to everything else)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
