-- Step 1: Drop the recursive policy that is causing the error.
DROP POLICY IF EXISTS "Allow all users to insert feedback for served orders" ON public.feedback;
DROP POLICY IF EXISTS "Allow users to insert their own feedback" ON public.feedback; -- Also drop the old one if it exists

-- Step 2: Add a UNIQUE constraint to the order_id column.
-- This is a more robust way to prevent duplicate feedback than using a policy check.
-- We add this constraint only if it doesn't already exist to make the script re-runnable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'feedback_order_id_key' AND conrelid = 'public.feedback'::regclass
  ) THEN
    ALTER TABLE public.feedback
    ADD CONSTRAINT feedback_order_id_key UNIQUE (order_id);
  END IF;
END;
$$;


-- Step 3: Re-create the INSERT policy without the duplicate check.
-- The UNIQUE constraint now handles the prevention of duplicate feedback.
-- This policy simply ensures that feedback can only be left for 'served' orders.
CREATE POLICY "Allow feedback insertion for served orders"
  ON public.feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = feedback.order_id AND orders.status = 'served'
    )
  );
