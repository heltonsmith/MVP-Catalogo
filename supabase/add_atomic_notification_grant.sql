-- Function to atomically grant permission to create a notification for a specific renewal cycle.
-- Returns true if the grant was successful (meaning no notification has been sent for this cycle yet).
-- Returns false if a notification for this cycle was already registered.

CREATE OR REPLACE FUNCTION check_and_grant_notification(
  p_company_id UUID,
  p_renewal_date TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE companies
  SET last_notified_renewal_date = p_renewal_date::TIMESTAMPTZ
  WHERE id = p_company_id
  AND (
    last_notified_renewal_date IS NULL 
    OR last_notified_renewal_date != p_renewal_date::TIMESTAMPTZ
  );

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;
