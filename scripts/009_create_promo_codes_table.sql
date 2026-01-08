-- Create promo codes table for discount management
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2),
  max_uses INT,
  current_uses INT DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo codes (public read active codes, admin manages all)
CREATE POLICY "promo_codes_read_active" ON promo_codes FOR SELECT USING (
  is_active AND start_date <= NOW() AND end_date >= NOW()
);

CREATE POLICY "promo_codes_admin_all" ON promo_codes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_code_usage(code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes SET current_uses = current_uses + 1 WHERE promo_codes.code = code;
END;
$$ LANGUAGE plpgsql;
