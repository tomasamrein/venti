-- customers
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  alias           TEXT,
  dni             TEXT,
  cuit            TEXT,
  email           CITEXT,
  phone           TEXT,
  address         TEXT,
  birthday        DATE,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  has_account     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name_trgm ON customers USING GIN (full_name gin_trgm_ops);

-- current_accounts
CREATE TABLE current_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit_limit    NUMERIC(12,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, customer_id)
);

-- current_account_transactions
CREATE TABLE current_account_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES current_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type            account_transaction_type NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  balance_after   NUMERIC(12,2) NOT NULL,
  description     TEXT,
  sale_id         UUID,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
