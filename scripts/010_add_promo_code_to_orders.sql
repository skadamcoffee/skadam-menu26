-- Add promo_code column to orders table
ALTER TABLE orders ADD COLUMN promo_code TEXT;

-- Add discount_amount column to track the discount applied
ALTER TABLE orders ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;
