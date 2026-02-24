-- Enable Realtime for the companies table
-- This allows AuthContext.jsx to receive immediate updates when an admin changes a store's status.

-- 1. Ensure the table is in the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE companies;

-- 2. Set replica identity to FULL to ensure all columns (like user_id) are available in the payload
-- This is critical for RLS and client-side filtering to work reliably in Realtime.
ALTER TABLE companies REPLICA IDENTITY FULL;
