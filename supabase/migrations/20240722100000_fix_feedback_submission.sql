-- Make the user_id column in the feedback table optional
ALTER TABLE public.feedback ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow users to insert their own feedback" ON public.feedback;

-- Create a new, more permissive INSERT policy
-- This policy allows anyone to insert feedback, as long as the order exists and is marked as 'served'.
-- It still prevents duplicate feedback for the same order.
CREATE POLICY "Allow all users to insert feedback for served orders"
  ON public.feedback
  FOR INSERT
  WITH CHECK (
    -- Check if the order exists and its status is 'served'
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = feedback.order_id AND orders.status = 'served'
    )
    -- Check to prevent duplicate feedback for the same order
    AND NOT EXISTS (
      SELECT 1
      FROM public.feedback f
      WHERE f.order_id = feedback.order_id
    )
  );

-- Keep the existing SELECT policy to ensure users can only see appropriate feedback
-- (Admins/staff see all, users see their own)
-- No changes needed here, but included for clarity.

-- Keep the existing DELETE policy for admin
-- No changes needed here.
