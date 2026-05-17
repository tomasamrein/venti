-- Update check_stock_alert to use stock_max/2 as threshold (consistent with
-- the suggested-purchases API). Falls back to 5 units when stock_max is not set.
-- Also resolves existing unresolved alerts when stock recovers above the threshold.

CREATE OR REPLACE FUNCTION public.check_stock_alert()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_threshold NUMERIC;
BEGIN
  -- Resolve any open alert if stock recovered above threshold
  v_threshold := CASE
    WHEN NEW.stock_max IS NOT NULL AND NEW.stock_max > 0 THEN NEW.stock_max / 2.0
    ELSE 5
  END;

  IF NEW.track_stock THEN
    IF NEW.stock_current > v_threshold THEN
      UPDATE stock_alerts
        SET is_resolved = TRUE, resolved_at = NOW()
        WHERE product_id = NEW.id AND is_resolved = FALSE;
    ELSE
      INSERT INTO stock_alerts (organization_id, product_id, alert_type, threshold, current_stock)
      VALUES (
        NEW.organization_id,
        NEW.id,
        CASE WHEN NEW.stock_current <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        v_threshold,
        NEW.stock_current
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
