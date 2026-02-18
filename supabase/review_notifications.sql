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
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Get company owner and name/slug
    SELECT user_id, name, slug INTO company_owner_id, company_name, comp_slug
    FROM companies
    WHERE id = NEW.company_id;

    -- Get actor (reviewer) info
    SELECT full_name, avatar_url INTO actor_name, actor_avatar
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
            'actor_avatar', actor_avatar
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS on_new_review ON reviews;
CREATE TRIGGER on_new_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION handle_new_review();
