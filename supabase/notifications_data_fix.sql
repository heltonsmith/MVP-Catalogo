-- 1. Backfill notifications from existing upgrade_requests
INSERT INTO public.notifications (user_id, type, title, content, is_read, metadata, created_at)
SELECT 
    c.user_id,
    'system' as type,
    CASE 
        WHEN ur.status = 'pending' THEN 'Solicitud Plan ' || UPPER(ur.requested_plan) || ' Recibida'
        WHEN ur.status = 'approved' THEN 'Plan ' || UPPER(ur.requested_plan) || ' Activado'
        ELSE 'Solicitud de Plan Rechazada'
    END as title,
    COALESCE(ur.admin_message, 'Tu solicitud para el plan ' || UPPER(ur.requested_plan) || ' está siendo procesada.'),
    false as is_read,
    jsonb_build_object('request_id', ur.id, 'plan', ur.requested_plan, 'status', ur.status) as metadata,
    ur.created_at
FROM public.upgrade_requests ur
JOIN public.companies c ON ur.company_id = c.id
ON CONFLICT DO NOTHING; -- Avoid duplicates if run multiple times

-- 2. Create function to automatically handle notifications for upgrade_requests
CREATE OR REPLACE FUNCTION handle_upgrade_request_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_content TEXT;
BEGIN
    -- Get owner user_id from company
    SELECT user_id INTO v_user_id FROM public.companies WHERE id = NEW.company_id;

    -- Define title based on status
    IF NEW.status = 'pending' THEN
        v_title := 'Solicitud Plan ' || UPPER(NEW.requested_plan) || ' Recibida';
        v_content := 'Hemos recibido tu solicitud. Te avisaremos cuando se active.';
    ELSIF NEW.status = 'approved' THEN
        v_title := 'Plan ' || UPPER(NEW.requested_plan) || ' Activado';
        v_content := COALESCE(NEW.admin_message, 'Tu plan ha sido activado correctamente.');
    ELSIF NEW.status = 'rejected' THEN
        v_title := 'Solicitud Rechazada';
        v_content := COALESCE(NEW.admin_message, 'Tu solicitud no ha podido ser procesada.');
    END IF;

    -- Check if notification for this request already exists
    -- If it does (on update), update it. If not, insert it.
    INSERT INTO public.notifications (user_id, type, title, content, metadata, is_read)
    VALUES (
        v_user_id,
        'system',
        v_title,
        v_content,
        jsonb_build_object('request_id', NEW.id, 'plan', NEW.requested_plan, 'status', NEW.status),
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
DROP TRIGGER IF EXISTS tr_upgrade_request_notification ON public.upgrade_requests;
CREATE TRIGGER tr_upgrade_request_notification
AFTER INSERT OR UPDATE OF status, admin_message ON public.upgrade_requests
FOR EACH ROW
EXECUTE FUNCTION handle_upgrade_request_notification();
