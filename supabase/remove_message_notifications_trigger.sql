-- Remove the trigger that sends message notifications to the general bell
-- We only want notifications in the inbox icon (which is handled by real-time subscriptions in Navbar.jsx)

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.handle_new_message_notification();
