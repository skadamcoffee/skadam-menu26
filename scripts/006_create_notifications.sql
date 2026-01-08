-- Create notifications table for order status updates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_status', 'order_placed', 'loyalty_reward', 'order_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications (users see their own, admins see all)
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Trigger to create notification when order is placed
CREATE OR REPLACE FUNCTION public.notify_order_placed()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify admin of new order
  INSERT INTO public.notifications (user_id, type, title, message, order_id)
  SELECT 
    users.id,
    'order_placed',
    'New Order Placed',
    'Table ' || NEW.table_number || ' placed a new order',
    NEW.id
  FROM public.users
  WHERE role = 'admin' OR role = 'staff';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_placed ON orders;

CREATE TRIGGER on_order_placed
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_placed();

-- Trigger to create notification when order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    -- Determine notification type and title based on new status
    DECLARE
      v_title TEXT;
      v_message TEXT;
    BEGIN
      CASE NEW.status
        WHEN 'preparing' THEN
          v_title := '👨‍🍳 Your order is being prepared';
          v_message := 'Table ' || NEW.table_number || ' order is now being prepared';
        WHEN 'ready' THEN
          v_title := '📦 Your order is ready!';
          v_message := 'Table ' || NEW.table_number || ' order is ready for pickup';
        WHEN 'served' THEN
          v_title := '✓ Enjoy your order!';
          v_message := 'Thank you for your order. Enjoy your drink!';
        WHEN 'cancelled' THEN
          v_title := 'Order Cancelled';
          v_message := 'Table ' || NEW.table_number || ' order has been cancelled';
        ELSE
          v_title := 'Order Status Updated';
          v_message := 'Your order status has been updated to ' || NEW.status;
      END CASE;

      -- Create notification for customer
      INSERT INTO public.notifications (user_id, type, title, message, order_id)
      VALUES (NEW.user_id, 'order_status', v_title, v_message, NEW.id);
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;

CREATE TRIGGER on_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- Trigger to create notification when loyalty reward is earned
CREATE OR REPLACE FUNCTION public.notify_loyalty_reward()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reward_available = TRUE AND OLD.reward_available = FALSE AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.user_id, 'loyalty_reward', '🎁 Reward Ready!', 'You have collected 10 stamps and unlocked a free drink!');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_loyalty_reward_earned ON loyalty;

CREATE TRIGGER on_loyalty_reward_earned
AFTER UPDATE ON loyalty
FOR EACH ROW
EXECUTE FUNCTION public.notify_loyalty_reward();
