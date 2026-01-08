-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create table_qr_codes table for storing QR info
CREATE TABLE IF NOT EXISTS table_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT NOT NULL UNIQUE,
  qr_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
CREATE POLICY "feedback_read_own" ON feedback FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "feedback_insert_own" ON feedback FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- RLS Policies for table_qr_codes (admins only)
CREATE POLICY "table_qr_codes_read_all" ON table_qr_codes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "table_qr_codes_insert_admin" ON table_qr_codes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "table_qr_codes_delete_admin" ON table_qr_codes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
