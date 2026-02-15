-- Analytics tracking functions for incrementing view and quote counters

-- Function to increment views counter
CREATE OR REPLACE FUNCTION increment_views(company_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quotes counter
CREATE OR REPLACE FUNCTION increment_quotes(company_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET quotes_count = COALESCE(quotes_count, 0) + 1
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_quotes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_quotes(uuid) TO anon;
