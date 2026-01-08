-- Fix RLS policies for loyalty table to allow admins full access
-- Drop existing policies
DROP POLICY IF EXISTS "loyalty_read_own" ON loyalty;
DROP POLICY IF EXISTS "loyalty_update_own" ON loyalty;

-- Create new RLS policies that allow admins to manage all loyalty records
CREATE POLICY "loyalty_read_own_or_admin" ON loyalty FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "loyalty_update_own_or_admin" ON loyalty FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "loyalty_insert_admin_only" ON loyalty FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
