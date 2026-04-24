-- cash_sessions
CREATE TABLE cash_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  opened_by       UUID NOT NULL REFERENCES auth.users(id),
  closed_by       UUID REFERENCES auth.users(id),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  opening_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_amount  NUMERIC(12,2),
  expected_amount NUMERIC(12,2),
  difference      NUMERIC(12,2),
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed'))
);

CREATE UNIQUE INDEX idx_cash_sessions_one_open
  ON cash_sessions(branch_id) WHERE status = 'open';

-- cash_movements
CREATE TABLE cash_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID NOT NULL REFERENCES branches(id),
  type            cash_movement_type NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  description     TEXT,
  reference_id    UUID,
  reference_type  TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- sales
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  session_id      UUID REFERENCES cash_sessions(id),
  customer_id     UUID REFERENCES customers(id),
  sold_by         UUID REFERENCES auth.users(id),
  status          sale_status NOT NULL DEFAULT 'completed',
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(12,2),
  change_amount   NUMERIC(12,2),
  notes           TEXT,
  hold_label      TEXT,
  sale_number     BIGINT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_org_created ON sales(organization_id, created_at DESC);
CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE customer_id IS NOT NULL;

-- sale_items
CREATE TABLE sale_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  barcode         TEXT,
  unit_price      NUMERIC(12,2) NOT NULL,
  quantity        NUMERIC(12,3) NOT NULL DEFAULT 1,
  discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 21,
  subtotal        NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from current_account_transactions to sales (after both tables exist)
ALTER TABLE current_account_transactions
  ADD CONSTRAINT fk_cat_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;

-- pending_sales
CREATE TABLE pending_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  session_id      UUID REFERENCES cash_sessions(id),
  customer_id     UUID REFERENCES customers(id),
  label           TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invoices
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          UUID REFERENCES sales(id) ON DELETE SET NULL,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id        UUID NOT NULL REFERENCES branches(id),
  customer_id      UUID REFERENCES customers(id),
  invoice_type     invoice_type NOT NULL,
  status           invoice_status NOT NULL DEFAULT 'draft',
  cae              TEXT,
  cae_vto          DATE,
  afip_punto_venta INT,
  afip_comp_nro    BIGINT,
  afip_comp_tipo   INT,
  customer_name    TEXT,
  customer_cuit    TEXT,
  customer_address TEXT,
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  items            JSONB NOT NULL DEFAULT '[]',
  qr_data          TEXT,
  pdf_url          TEXT,
  issued_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expenses
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id),
  session_id      UUID REFERENCES cash_sessions(id),
  category        TEXT NOT NULL DEFAULT 'general',
  description     TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  supplier_id     UUID REFERENCES suppliers(id),
  receipt_url     TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
