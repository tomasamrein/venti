CREATE TABLE stock_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','canceled')),
  total_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  ordered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES stock_orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal     NUMERIC(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE stock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage stock_orders"
  ON stock_orders FOR ALL
  USING (organization_id = ANY(get_user_org_ids()));

CREATE POLICY "org members can manage stock_order_items"
  ON stock_order_items FOR ALL
  USING (order_id IN (
    SELECT id FROM stock_orders WHERE organization_id = ANY(get_user_org_ids())
  ));
