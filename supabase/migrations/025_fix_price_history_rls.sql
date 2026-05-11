-- Fix: price_history trigger fails because function lacks SECURITY DEFINER
-- and the table has no INSERT policy, blocking bulk/individual price updates.

-- Make the trigger function SECURITY DEFINER so it bypasses RLS on INSERT
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.price_sell <> NEW.price_sell OR OLD.price_cost IS DISTINCT FROM NEW.price_cost THEN
    INSERT INTO public.price_history
      (product_id, organization_id, price_cost_old, price_cost_new,
       price_sell_old, price_sell_new, change_pct, changed_by)
    VALUES (
      NEW.id, NEW.organization_id, OLD.price_cost, NEW.price_cost,
      OLD.price_sell, NEW.price_sell,
      ROUND(((NEW.price_sell - OLD.price_sell) / NULLIF(OLD.price_sell, 0)) * 100, 2),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;
