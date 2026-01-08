-- Create store_settings table for coffee shop configuration
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_time TIME NOT NULL DEFAULT '06:00',
  closing_time TIME NOT NULL DEFAULT '22:00',
  wifi_password TEXT,
  wifi_qr_code_url TEXT,
  shop_name TEXT DEFAULT 'SKADAM Coffee Shop',
  shop_description TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create staff_activity_logs table to track login/logout
CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout')),
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  device_info TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_logs_user_id ON staff_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_logs_timestamp ON staff_activity_logs(timestamp);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- Store settings - admins can read/write all, customers can only read
CREATE POLICY store_settings_admin_all ON store_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY store_settings_read_all ON store_settings
  FOR SELECT
  USING (true);

-- Staff activity logs - admins can read all, users can only read their own
CREATE POLICY staff_logs_admin_all ON staff_activity_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY staff_logs_insert_own ON staff_activity_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY staff_logs_read_own_or_admin ON staff_activity_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
