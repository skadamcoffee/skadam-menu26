-- This script fixes RLS policies for the orders table to be idempotent and correct.
-- It ensures that staff can update orders, users can create them, and the correct read permissions are set.

-- Drop all related policies first to ensure a clean slate.
DROP POLICY IF EXISTS "Allow staff to update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow individual read access" ON public.orders;

-- Create a policy to allow staff (admin or barista) to update orders.
CREATE POLICY "Allow staff to update orders"
  ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'barista')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'barista')
    )
  );

-- Create a policy to allow any authenticated user to insert a new order.
CREATE POLICY "Allow authenticated users to insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- Create a policy to allow staff to read all orders, and individual users to read their own.
CREATE POLICY "Allow individual read access"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'barista')
    ));
