-- Create staff table for barista/staff login with passwords
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'barista' CHECK (role IN ('barista', 'staff', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- RLS policy: allow read by admins only
CREATE POLICY "staff_read_admin" ON staff FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- RLS policy: allow insert/update by admins only
CREATE POLICY "staff_write_admin" ON staff FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "staff_update_admin" ON staff FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Create staff sessions table to track logins
CREATE TABLE IF NOT EXISTS staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  login_time TIMESTAMP NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy: admins can read all sessions
CREATE POLICY "staff_sessions_read" ON staff_sessions FOR SELECT USING (TRUE);
