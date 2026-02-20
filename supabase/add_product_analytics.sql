-- Add analytics columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views int8 DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quotes_count int8 DEFAULT 0;

-- RPC to safely increment product views
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to safely increment product quotes
CREATE OR REPLACE FUNCTION increment_product_quote(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET quotes_count = COALESCE(quotes_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION increment_product_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_product_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_quote(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_product_quote(UUID) TO authenticated;
