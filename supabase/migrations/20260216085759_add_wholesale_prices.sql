-- Add wholesale_prices column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_prices JSONB DEFAULT '[]';

COMMENT ON COLUMN products.wholesale_prices IS 'Array of wholesale price tiers: [{min_qty: number, price: number, label: string}]';
