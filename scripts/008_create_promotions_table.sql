-- Create promotions/offers table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_text TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions (public read active promotions, admin manages all)
CREATE POLICY "promotions_read_active" ON promotions FOR SELECT USING (
  is_active AND start_date <= NOW() AND end_date >= NOW()
);

CREATE POLICY "promotions_admin_all" ON promotions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
