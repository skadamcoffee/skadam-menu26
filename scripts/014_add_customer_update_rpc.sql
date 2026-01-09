-- This script creates a new Remote Procedure Call (RPC) in Supabase.
-- The function allows a customer to update the status of their own order to 'served'.
-- This is a secure way to grant limited update permissions to users.

-- Drop the function if it already exists to make the script idempotent.
DROP FUNCTION IF EXISTS update_order_to_served(order_id_param UUID);

CREATE OR REPLACE FUNCTION update_order_to_served(order_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if the user is the owner of the order and if the order is ready for pickup.
  IF EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = order_id_param
      AND user_id = auth.uid()
      AND status = 'ready'
  ) THEN
    -- If the conditions are met, update the order status to 'served'.
    UPDATE public.orders
    SET status = 'served',
        updated_at = NOW()
    WHERE id = order_id_param;
  ELSE
    -- If the user is not authorized or the order is not in the correct state, raise an exception.
    RAISE EXCEPTION 'You are not authorized to perform this action or the order is not ready.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the 'authenticated' role so that any logged-in user can call this function.
GRANT EXECUTE ON FUNCTION update_order_to_served(UUID) TO authenticated;
