-- Eliminar el trigger y la función de notificación automática
DROP TRIGGER IF EXISTS on_new_whatsapp_quote ON public.whatsapp_quotes;
DROP FUNCTION IF EXISTS public.handle_new_quote_notification();

-- Mensaje de confirmación
SELECT 'Trigger de notificaciones automáticas eliminado correctamente' as result;
