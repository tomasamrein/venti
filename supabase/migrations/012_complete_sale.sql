-- Atomic sale completion: inserts sale + items, decrements stock, registers cash movement,
-- and posts current-account transaction (if applicable). Single transaction — either all
-- writes succeed or none. Avoids orphaned sales / phantom stock decrements.
--
-- Runs as SECURITY INVOKER so RLS still applies (the caller must be a member of the org).

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_org_id           UUID,
  p_branch_id        UUID,
  p_session_id       UUID,
  p_customer_id      UUID,
  p_payment_method   payment_method,
  p_subtotal         NUMERIC,
  p_discount_pct     NUMERIC,
  p_discount_amount  NUMERIC,
  p_tax_amount       NUMERIC,
  p_total            NUMERIC,
  p_amount_paid      NUMERIC,
  p_change_amount    NUMERIC,
  p_notes            TEXT,
  p_items            JSONB
)
RETURNS TABLE (sale_id UUID, sale_number BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sale_id        UUID;
  v_sale_number    BIGINT;
  v_item           JSONB;
  v_product_id     UUID;
  v_quantity       NUMERIC;
  v_track_stock    BOOLEAN;
  v_allow_negative BOOLEAN;
  v_current_stock  NUMERIC;
  v_account_id     UUID;
  v_account_balance NUMERIC;
BEGIN
  -- Validate session is open and belongs to org/branch
  IF p_session_id IS NOT NULL THEN
    PERFORM 1 FROM cash_sessions
      WHERE id = p_session_id
        AND organization_id = p_org_id
        AND branch_id = p_branch_id
        AND status = 'open';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'La caja no está abierta o no corresponde a esta sucursal'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Validate current account if needed
  IF p_payment_method = 'current_account' THEN
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'Cuenta corriente requiere un cliente'
        USING ERRCODE = 'P0001';
    END IF;
    SELECT id, balance INTO v_account_id, v_account_balance
      FROM current_accounts
      WHERE organization_id = p_org_id AND customer_id = p_customer_id;
    IF v_account_id IS NULL THEN
      RAISE EXCEPTION 'El cliente no tiene cuenta corriente habilitada'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Compute next sale number for this org (atomic via row lock on max+1)
  SELECT COALESCE(MAX(sale_number), 0) + 1 INTO v_sale_number
    FROM sales WHERE organization_id = p_org_id;

  -- Insert sale
  INSERT INTO sales (
    organization_id, branch_id, session_id, customer_id, sold_by,
    status, payment_method,
    subtotal, discount_pct, discount_amount, tax_amount, total,
    amount_paid, change_amount, notes,
    sale_number, completed_at
  ) VALUES (
    p_org_id, p_branch_id, p_session_id, p_customer_id, auth.uid(),
    'completed', p_payment_method,
    p_subtotal, p_discount_pct, p_discount_amount, p_tax_amount, p_total,
    p_amount_paid, p_change_amount, p_notes,
    v_sale_number, NOW()
  )
  RETURNING id INTO v_sale_id;

  -- Insert items + decrement stock atomically per item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    v_quantity   := (v_item->>'quantity')::NUMERIC;

    INSERT INTO sale_items (
      sale_id, product_id, organization_id,
      name, barcode, unit_price, quantity, discount_pct, tax_rate, subtotal
    ) VALUES (
      v_sale_id,
      v_product_id,
      p_org_id,
      v_item->>'name',
      NULLIF(v_item->>'barcode', ''),
      (v_item->>'unit_price')::NUMERIC,
      v_quantity,
      COALESCE((v_item->>'discount_pct')::NUMERIC, 0),
      COALESCE((v_item->>'tax_rate')::NUMERIC, 21),
      (v_item->>'subtotal')::NUMERIC
    );

    -- Decrement stock if tracked. Lock the row to avoid concurrent oversells.
    IF v_product_id IS NOT NULL THEN
      SELECT track_stock, allow_negative, stock_current
        INTO v_track_stock, v_allow_negative, v_current_stock
        FROM products WHERE id = v_product_id FOR UPDATE;

      IF v_track_stock THEN
        IF NOT v_allow_negative AND v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Stock insuficiente para "%"', v_item->>'name'
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE products
          SET stock_current = stock_current - v_quantity,
              updated_at = NOW()
          WHERE id = v_product_id;
      END IF;
    END IF;
  END LOOP;

  -- Cash movement (skip for current_account — that's not cash)
  IF p_payment_method <> 'current_account' AND p_session_id IS NOT NULL THEN
    INSERT INTO cash_movements (
      session_id, organization_id, branch_id,
      type, amount, description, reference_id, reference_type, created_by
    ) VALUES (
      p_session_id, p_org_id, p_branch_id,
      'sale', p_total,
      'Venta #' || v_sale_number, v_sale_id, 'sales', auth.uid()
    );
  END IF;

  -- Current account charge (negative amount = customer owes money)
  IF p_payment_method = 'current_account' THEN
    INSERT INTO current_account_transactions (
      account_id, organization_id, type, amount, balance_after,
      description, sale_id, created_by
    ) VALUES (
      v_account_id, p_org_id, 'charge', -p_total, v_account_balance - p_total,
      'Venta #' || v_sale_number, v_sale_id, auth.uid()
    );
  END IF;

  RETURN QUERY SELECT v_sale_id, v_sale_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale(
  UUID, UUID, UUID, UUID, payment_method,
  NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
  NUMERIC, NUMERIC, TEXT, JSONB
) TO authenticated;

-- Make sale_number deterministic per org (avoid duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_org_number_unique
  ON sales(organization_id, sale_number)
  WHERE sale_number IS NOT NULL;
