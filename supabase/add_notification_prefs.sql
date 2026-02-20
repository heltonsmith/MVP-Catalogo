-- Add notification_prefs JSON column to companies
-- Stores bell notification preferences per store:
--   notify_follow  : boolean (default true) — "New follower" notifications
--   notify_favorite : boolean (default true) — "New favorite" notifications
--   notify_quote   : boolean (default true) — "New WhatsApp quote" notifications

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"notify_follow": true, "notify_favorite": true, "notify_quote": true}'::jsonb;
