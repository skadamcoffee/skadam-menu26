-- This script adds Row-Level Security (RLS) policies to the `feedback` table.
-- It allows customers to submit feedback for their own completed orders and allows staff to view it.

-- Enable RLS on the feedback table if it's not already enabled.
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate and allow for idempotent script execution.
DROP POLICY IF EXISTS "Allow users to insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow staff and users to read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow admin to delete feedback" ON public.feedback;

-- 1. INSERT Policy: 
-- Allows authenticated users to insert feedback for their own 'served' orders.
-- It also prevents duplicate feedback submissions for the same order.
CREATE POLICY "Allow users to insert their own feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.orders
        WHERE orders.id = feedback.order_id
          AND orders.user_id = auth.uid()
          AND orders.status = 'served'
      )
    )
    AND (
        NOT EXISTS (
            SELECT 1
            FROM public.feedback f
            WHERE f.order_id = feedback.order_id
        )
    )
  );

-- 2. SELECT Policy: 
-- Allows users to read their own feedback, and staff (admin/barista) to read all feedback.
CREATE POLICY "Allow staff and users to read feedback"
    ON public.feedback
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'barista')
        )
    );

-- 3. DELETE Policy: 
-- Allows only admin users to delete feedback entries.
CREATE POLICY "Allow admin to delete feedback"
    ON public.feedback
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );
