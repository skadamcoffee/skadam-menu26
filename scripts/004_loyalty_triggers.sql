-- Trigger to add stamp when order is marked as ready or served
CREATE OR REPLACE FUNCTION public.add_loyalty_stamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ready', 'served') AND OLD.status != NEW.status THEN
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.loyalty
      SET 
        stamps = CASE 
          WHEN stamps < 10 THEN stamps + 1 
          ELSE 10 
        END,
        reward_available = CASE 
          WHEN stamps + 1 >= 10 THEN TRUE 
          ELSE reward_available 
        END,
        last_stamp_date = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_ready_stamp ON orders;

CREATE TRIGGER on_order_ready_stamp
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.add_loyalty_stamp();
