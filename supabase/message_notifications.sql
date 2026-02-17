-- Trigger to notify Store Owner about new messages from Customers

CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    company_owner_id UUID;
    customer_name TEXT;
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Only notify if sender is a customer
    IF NEW.sender_type = 'customer' THEN
        -- Get company owner
        SELECT user_id INTO company_owner_id
        FROM companies
        WHERE id = NEW.company_id;

        -- Get customer name from profiles
        SELECT full_name INTO customer_name
        FROM profiles
        WHERE id = NEW.customer_id;

        -- Fallback name
        IF customer_name IS NULL THEN
            customer_name := 'Un cliente';
        END IF;

        notification_title := 'Nuevo mensaje';
        notification_content := customer_name || ' te ha enviado un mensaje.';

        -- Insert notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        )
        VALUES (
            company_owner_id,
            'message',
            notification_title,
            notification_content,
            jsonb_build_object(
                'message_id', NEW.id,
                'customer_id', NEW.customer_id,
                'company_id', NEW.company_id,
                'customer_name', customer_name,
                'comment', NEW.content -- Using 'comment' key to match NotificationCenter logic or 'content'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION handle_new_message_notification();
