-- Enable DELETE for whatsapp_quotes
-- This allows users to delete their own quote history.

-- 1. Create DELETE policy
DROP POLICY IF EXISTS "Users can delete own whatsapp history" ON public.whatsapp_quotes;
CREATE POLICY "Users can delete own whatsapp history" ON public.whatsapp_quotes
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Force schema reload to ensure permission takes effect immediately
NOTIFY pgrst, 'reload schema';
