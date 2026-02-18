-- Run this in the Supabase SQL Editor to hardening Realtime delivery

-- 1. Notifications table needs FULL replica identity for RLS broadcast
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2. Ensure store_follows also has it if we listen there
ALTER TABLE public.store_follows REPLICA IDENTITY FULL;

-- 3. Double check the publication
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 4. Verify RLS policies (must be SELECTable by the user)
-- This is already done in fix_all_db_issues but we re-verify
-- CREATE POLICY "Users can view their own notifications" ON public.notifications
--     FOR SELECT USING (auth.uid() = user_id);
