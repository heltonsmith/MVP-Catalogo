-- Add SKU column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Create index for faster SKU searches
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Add comment for clarity
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - Unique identifier for product inventory';
