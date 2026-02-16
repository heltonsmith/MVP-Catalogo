-- Migration to add detailed info to upgrade_requests
ALTER TABLE public.upgrade_requests
ADD COLUMN IF NOT EXISTS billing_period TEXT,
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS admin_message TEXT;

-- Robust handling of notification_type enum
DO $$
BEGIN
    -- 1. Create the type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('quote', 'stock', 'visit', 'message', 'chat', 'system');
    ELSE
        -- 2. If it exists, add 'system' if missing
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'notification_type' AND e.enumlabel = 'system') THEN
            ALTER TYPE notification_type ADD VALUE 'system';
        END IF;
    END IF;
END
$$;
