-- product_categories
CREATE TABLE product_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  icon            TEXT,
  parent_id       UUID REFERENCES product_categories(id),
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- products
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  barcode         TEXT,
  sku             TEXT,
  unit            TEXT NOT NULL DEFAULT 'un',
  price_cost      NUMERIC(12,2),
  price_sell      NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_sell_b    NUMERIC(12,2),
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 21,
  stock_current   NUMERIC(12,3) NOT NULL DEFAULT 0,
  stock_min       NUMERIC(12,3) NOT NULL DEFAULT 0,
  stock_max       NUMERIC(12,3),
  track_stock     BOOLEAN NOT NULL DEFAULT TRUE,
  allow_negative  BOOLEAN NOT NULL DEFAULT FALSE,
  image_url       TEXT,
  brand           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  label_template  JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, barcode)
);

CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- price_history
CREATE TABLE price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  price_cost_old  NUMERIC(12,2),
  price_cost_new  NUMERIC(12,2),
  price_sell_old  NUMERIC(12,2),
  price_sell_new  NUMERIC(12,2),
  change_pct      NUMERIC(6,2),
  reason          TEXT,
  changed_by      UUID REFERENCES auth.users(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- suppliers
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  alias           TEXT,
  cuil            TEXT,
  cuit            TEXT,
  email           CITEXT,
  phone           TEXT,
  address         TEXT,
  category        TEXT,
  contact_name    TEXT,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- supplier_products
CREATE TABLE supplier_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_sku    TEXT,
  supplier_price  NUMERIC(12,2),
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);
