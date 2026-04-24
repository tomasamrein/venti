-- 1. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Record price history on price change
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.price_sell <> NEW.price_sell OR OLD.price_cost IS DISTINCT FROM NEW.price_cost THEN
    INSERT INTO public.price_history
      (product_id, organization_id, price_cost_old, price_cost_new,
       price_sell_old, price_sell_new, change_pct, changed_by)
    VALUES (
      NEW.id, NEW.organization_id,
      OLD.price_cost, NEW.price_cost,
      OLD.price_sell, NEW.price_sell,
      ROUND(((NEW.price_sell - OLD.price_sell) / NULLIF(OLD.price_sell, 0)) * 100, 2),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_price_history
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.record_price_history();

-- 3. Stock alert on low stock
CREATE OR REPLACE FUNCTION public.check_stock_alert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock_current <= NEW.stock_min AND NEW.track_stock THEN
    INSERT INTO public.stock_alerts
      (organization_id, product_id, alert_type, threshold, current_stock)
    VALUES (
      NEW.organization_id, NEW.id,
      CASE WHEN NEW.stock_current <= 0 THEN 'out_of_stock'::alert_type ELSE 'low_stock'::alert_type END,
      NEW.stock_min, NEW.stock_current
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stock_alert
  AFTER UPDATE OF stock_current ON products
  FOR EACH ROW EXECUTE FUNCTION public.check_stock_alert();

-- 4. Update current_account balance on transaction insert
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.current_accounts
  SET balance = balance + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_account_balance
  AFTER INSERT ON current_account_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- 5. moddatetime triggers for updated_at columns
CREATE TRIGGER trg_updated_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_branches
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_suppliers
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_sales
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_current_accounts
  BEFORE UPDATE ON current_accounts
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER trg_updated_pending_sales
  BEFORE UPDATE ON pending_sales
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
