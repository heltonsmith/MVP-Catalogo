-- Trigger para notificar al dueño de la tienda cuando llega una nueva cotización de WhatsApp

CREATE OR REPLACE FUNCTION public.handle_new_quote_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    store_name TEXT;
    customer_display_name TEXT;
BEGIN
    -- Obtener el dueño de la tienda y el nombre de la tienda
    SELECT user_id, name INTO target_user_id, store_name
    FROM public.companies
    WHERE id = NEW.company_id;

    -- Solo notificar si se encontró al dueño
    IF target_user_id IS NOT NULL THEN
        -- Determinar el nombre a mostrar del cliente
        -- Si hay user_id, intentar buscar su nombre en profiles, sino usar el customer_name del registro
        -- Pero NEW.customer_name viene del formulario, así que es confiable.
        customer_display_name := COALESCE(NEW.customer_name, 'Un cliente');

        -- Insertar notificación
        INSERT INTO public.notifications (user_id, type, title, content, metadata)
        VALUES (
            target_user_id,
            'quote',
            'Nueva Cotización por WhatsApp',
            'El cliente ' || customer_display_name || ' ha generado una cotización de ' || to_char(NEW.total, 'FM$999,999,999') || '.',
            jsonb_build_object(
                'quote_id', NEW.id,
                'customer_email', NEW.customer_email,
                'customer_name', NEW.customer_name,
                'total', NEW.total,
                'company_id', NEW.company_id,
                'items_count', jsonb_array_length(NEW.items)
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_new_whatsapp_quote ON public.whatsapp_quotes;
CREATE TRIGGER on_new_whatsapp_quote
    AFTER INSERT ON public.whatsapp_quotes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_quote_notification();

-- Mensaje de confirmación
SELECT 'Trigger de notificaciones de cotización creado exitosamente' as result;
