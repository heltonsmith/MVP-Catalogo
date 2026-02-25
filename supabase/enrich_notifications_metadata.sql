-- 1. Update Trigger: Include 'actor_role' in NEW message notifications
CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    company_owner_id UUID;
    customer_name TEXT;
    customer_avatar TEXT;
    customer_role TEXT;
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Only notify if sender is a customer
    IF NEW.sender_type = 'customer' THEN
        -- Get company owner
        SELECT user_id INTO company_owner_id
        FROM companies
        WHERE id = NEW.company_id;

        -- Get customer info and role from profiles
        SELECT full_name, avatar_url, role INTO customer_name, customer_avatar, customer_role
        FROM profiles
        WHERE id = NEW.customer_id;

        -- Fallback name
        IF customer_name IS NULL THEN
            customer_name := 'Un cliente';
        END IF;

        notification_title := 'Nuevo mensaje';
        notification_content := customer_name || ' te ha enviado un mensaje.';

        -- Insert notification with actor_role in metadata
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
                'actor_avatar', customer_avatar,
                'actor_role', customer_role,
                'comment', NEW.content
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update Trigger: Include 'actor_role' in NEW review notifications
CREATE OR REPLACE FUNCTION handle_new_review()
RETURNS TRIGGER AS $$
DECLARE
    company_owner_id UUID;
    company_name TEXT;
    comp_slug TEXT;
    prod_slug TEXT;
    product_name TEXT;
    actor_name TEXT;
    actor_avatar TEXT;
    actor_role TEXT;
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Get company owner and name/slug
    SELECT user_id, name, slug INTO company_owner_id, company_name, comp_slug
    FROM companies
    WHERE id = NEW.company_id;

    -- Get actor (reviewer) info and role
    SELECT full_name, avatar_url, role INTO actor_name, actor_avatar, actor_role
    FROM profiles
    WHERE id = NEW.user_id;

    -- Fallback for name
    IF actor_name IS NULL THEN
        actor_name := NEW.customer_name;
    END IF;
    IF actor_name IS NULL THEN
        actor_name := 'Un cliente';
    END IF;

    -- If it's a product review
    IF NEW.product_id IS NOT NULL THEN
        SELECT name, slug INTO product_name, prod_slug
        FROM products
        WHERE id = NEW.product_id;

        notification_title := 'Nueva calificación de producto';
        notification_content := actor_name || ' calificó con ' || NEW.rating || ' estrellas el producto ' || product_name;
    ELSE
        -- Store review
        notification_title := 'Nueva calificación de tienda';
        notification_content := actor_name || ' calificó con ' || NEW.rating || ' estrellas tu tienda ' || company_name;
    END IF;

    -- Insert notification with actor_role in metadata
    INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
    )
    VALUES (
        company_owner_id,
        'review',
        notification_title,
        notification_content,
        jsonb_build_object(
            'review_id', NEW.id,
            'product_id', NEW.product_id,
            'company_id', NEW.company_id,
            'company_slug', comp_slug,
            'product_slug', prod_slug,
            'rating', NEW.rating,
            'comment', NEW.comment,
            'customer_name', actor_name,
            'actor_avatar', actor_avatar,
            'actor_role', actor_role
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Historical Data Enrichment: Add 'actor_role' to existing notifications
DO $$
DECLARE
    admin_id UUID;
BEGIN
    FOR admin_id IN SELECT id FROM profiles WHERE role = 'admin' LOOP
        UPDATE notifications
        SET metadata = metadata || jsonb_build_object('actor_role', 'admin')
        WHERE (metadata->>'customer_id' = admin_id::text OR user_id = admin_id)
          AND (type = 'message' OR type = 'review' OR type = 'chat')
          AND NOT (metadata ? 'actor_role');
    END LOOP;
END $$;
