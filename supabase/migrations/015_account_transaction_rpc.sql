-- Atomic current-account transaction.
-- Reads the live balance with FOR UPDATE (prevents race conditions),
-- computes balance_after server-side, and inserts the transaction row.
-- The existing trg_account_balance trigger then updates current_accounts.balance.
--
-- Returns the resulting balance so the client can update its UI without a
-- separate round-trip.

CREATE OR REPLACE FUNCTION public.record_account_transaction(
  p_account_id      UUID,
  p_organization_id UUID,
  p_type            account_transaction_type,   -- 'charge' | 'payment' | 'adjustment'
  p_amount          NUMERIC,                    -- always positive; direction is derived from type
  p_description     TEXT DEFAULT NULL,
  p_sale_id         UUID DEFAULT NULL,
  p_created_by      UUID DEFAULT NULL
)
RETURNS TABLE (
  transaction_id UUID,
  balance_after  NUMERIC,
  new_balance    NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance NUMERIC;
  v_signed_amount   NUMERIC;
  v_balance_after   NUMERIC;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  -- Verify membership: caller must belong to the org that owns this account
  IF NOT EXISTS (
    SELECT 1 FROM current_accounts ca
    JOIN organization_members om ON om.organization_id = ca.organization_id
    WHERE ca.id = p_account_id
      AND ca.organization_id = p_organization_id
      AND om.user_id = auth.uid()
      AND om.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Sin permisos para operar esta cuenta';
  END IF;

  -- Lock the account row to prevent concurrent balance updates
  SELECT balance INTO v_current_balance
  FROM current_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta corriente no encontrada';
  END IF;

  -- Convention: charge = negative (customer owes), payment = positive (customer pays)
  v_signed_amount := CASE p_type
    WHEN 'charge'     THEN -p_amount
    WHEN 'payment'    THEN  p_amount
    WHEN 'adjustment' THEN  p_amount   -- caller controls sign via p_amount sign for adjustments
    ELSE RAISE EXCEPTION 'Tipo de transacción inválido: %', p_type
  END;

  v_balance_after := v_current_balance + v_signed_amount;

  -- Insert transaction (trg_account_balance will update current_accounts.balance)
  INSERT INTO current_account_transactions (
    account_id, organization_id, type, amount, balance_after,
    description, sale_id, created_by
  ) VALUES (
    p_account_id, p_organization_id, p_type, v_signed_amount, v_balance_after,
    COALESCE(p_description, CASE p_type WHEN 'charge' THEN 'Cargo manual' WHEN 'payment' THEN 'Pago recibido' ELSE 'Ajuste' END),
    p_sale_id, COALESCE(p_created_by, auth.uid())
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_transaction_id, v_balance_after, v_balance_after;
END;
$$;

-- Grant execute to authenticated users (RLS inside the function acts as guard)
GRANT EXECUTE ON FUNCTION public.record_account_transaction TO authenticated;
