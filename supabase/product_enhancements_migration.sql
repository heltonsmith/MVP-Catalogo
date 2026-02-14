-- Product Registration Enhancements Migration
-- Run this in Supabase SQL Editor

-- 1. Add weight and size columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

-- 2. Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create product_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_images
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product images" ON product_images;
DROP POLICY IF EXISTS "Users can update their own product images" ON product_images;
DROP POLICY IF EXISTS "Users can delete their own product images" ON product_images;

CREATE POLICY "Anyone can view product images"
    ON product_images FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert product images"
    ON product_images FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own product images"
    ON product_images FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN companies c ON p.company_id = c.id
            WHERE p.id = product_images.product_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own product images"
    ON product_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN companies c ON p.company_id = c.id
            WHERE p.id = product_images.product_id
            AND c.user_id = auth.uid()
        )
    );

-- 6. RLS Policies for product_categories
DROP POLICY IF EXISTS "Anyone can view product categories" ON product_categories;
DROP POLICY IF EXISTS "Authenticated users can manage product categories" ON product_categories;

CREATE POLICY "Anyone can view product categories"
    ON product_categories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage product categories"
    ON product_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN companies c ON p.company_id = c.id
            WHERE p.id = product_categories.product_id
            AND c.user_id = auth.uid()
        )
    );

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(display_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- 8. Create storage bucket for product images (run separately in Supabase Dashboard)
-- Bucket name: product-images
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
