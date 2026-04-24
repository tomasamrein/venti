# Venti — CRM/POS SaaS para Negocios Argentinos

## Descripción del Proyecto

**Venti** es un sistema de punto de venta (POS) y CRM multi-tenant orientado a kioscos, almacenes, drugstores y negocios minoristas de Argentina. El nombre es corto, amigable y moderno — el sistema debe transmitir esa misma simpleza en su diseño.

- **Modelo de negocio**: SaaS con suscripción mensual cobrada vía Mercado Pago Subscriptions
- **Planes**: Free Trial (14 días), Basic, Pro (multi-sucursal, reportes avanzados)
- **Público objetivo**: Dueños de pequeños comercios en Argentina
- **Distribución**: Online (landing page) + venta local en ciudad del desarrollador
- **Revenue**: El dueño del producto gestiona todos los tenants desde un panel super-admin

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 14+ (App Router) | Framework fullstack |
| TypeScript | 5+ | Tipado estático |
| shadcn/ui | latest | Componentes UI |
| Tailwind CSS | 3+ | Estilos |
| Supabase | 2+ | DB, Auth, Storage, Realtime |
| Mercado Pago SDK | 2+ | Cobros y suscripciones |
| Zustand | 4+ | Estado global (carrito, org) |
| TanStack Query | 5+ | Server state y cache |
| Recharts | 2+ | Gráficos del dashboard |
| Dexie.js | 3+ | IndexedDB para modo offline |
| @zxing/browser | 0.1+ | Escáner de código de barras por cámara |
| @react-pdf/renderer | 3+ | Generación de PDFs (facturas, etiquetas) |
| next-themes | 0.3+ | Dark/Light mode |
| Zod | 3+ | Validación de schemas |
| React Hook Form | 7+ | Formularios |
| date-fns + date-fns-tz | 3+ | Manejo de fechas con timezone |
| sonner | 1+ | Notificaciones toast |
| node-forge | 1+ | Firma CMS para ARCA/AFIP |
| web-push | 3+ | Web Push API (notificaciones push) |
| papaparse | 5+ | CSV export/import |
| exceljs | 4+ | Export XLSX |
| jsbarcode | 3+ | Generación de códigos de barra |
| jspdf | 2+ | PDF de etiquetas para impresión |

---

## Supabase

- **Project ID**: `qpykyxeigznotjtykzjw`
- **Project name**: Venti
- **Region**: `sa-east-1` (São Paulo — el más cercano a Argentina)
- **URL**: `https://qpykyxeigznotjtykzjw.supabase.co`
- **PostgreSQL**: 17.6
- **Estado inicial**: Vacío, solo tablas de auth de Supabase

---

## Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qpykyxeigznotjtykzjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Mercado Pago
MP_ACCESS_TOKEN=<mp_access_token>
MP_WEBHOOK_SECRET=<mp_webhook_secret>
NEXT_PUBLIC_MP_PUBLIC_KEY=<mp_public_key>

# ARCA / AFIP
ARCA_ENVIRONMENT=homologation          # o "production"
ARCA_WSAA_URL=https://wsaahomo.afip.gov.ar/ws/services/LoginCms
ARCA_WSFEV1_URL=https://wswhomo.afip.gov.ar/wsfev1/service.asmx

# Web Push (VAPID)
VAPID_PUBLIC_KEY=<vapid_public_key>
VAPID_PRIVATE_KEY=<vapid_private_key>
VAPID_SUBJECT=mailto:tomasamrein72@gmail.com

# App
NEXT_PUBLIC_APP_URL=https://app.venti.ar
SUPER_ADMIN_EMAIL=tomasamrein72@gmail.com
```

---

## Roles y Permisos

| Acción | Owner | Admin | Cashier |
|---|---|---|---|
| Ver dashboard y reportes | ✅ | ✅ | ❌ |
| Crear/editar ventas (POS) | ✅ | ✅ | ✅ |
| Editar productos y precios | ✅ | ✅ | ❌ |
| Actualización masiva de precios | ✅ | ✅ | ❌ |
| Ver historial de precios | ✅ | ✅ | ❌ |
| Gestionar proveedores | ✅ | ✅ | ❌ |
| Gestionar clientes y cuentas corrientes | ✅ | ✅ | ✅ (solo ver) |
| Emitir facturas ARCA | ✅ | ✅ | ✅ |
| Abrir/cerrar caja | ✅ | ✅ | ✅ |
| Ver historial de caja | ✅ | ✅ | solo propia sesión |
| Gestionar sucursales | ✅ | ❌ | ❌ |
| Gestionar equipo (invitar usuarios) | ✅ | ✅ | ❌ |
| Configuración de facturación ARCA | ✅ | ❌ | ❌ |
| Gestionar suscripción | ✅ | ❌ | ❌ |
| **Super-admin** | acceso total a todos los tenants |

---

## Schema de Base de Datos

### Extensiones a habilitar primero

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "moddatetime";
```

### ENUMs

```sql
CREATE TYPE plan_type AS ENUM ('free_trial', 'basic', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'paused');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'cashier');
CREATE TYPE invoice_type AS ENUM ('A', 'B', 'C', 'ticket', 'non_fiscal');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'canceled', 'voided');
CREATE TYPE sale_status AS ENUM ('completed', 'on_hold', 'canceled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'debit', 'credit', 'transfer', 'mercadopago', 'current_account', 'mixed');
CREATE TYPE cash_movement_type AS ENUM ('sale', 'expense', 'deposit', 'withdrawal', 'opening', 'closing');
CREATE TYPE alert_type AS ENUM ('low_stock', 'out_of_stock', 'price_change', 'subscription');
CREATE TYPE account_transaction_type AS ENUM ('charge', 'payment', 'adjustment');
```

### Tablas

#### `organizations` — Tenants (negocios)

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  cuit          TEXT,
  address       TEXT,
  phone         TEXT,
  email         CITEXT,
  logo_url      TEXT,
  timezone      TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  currency      TEXT NOT NULL DEFAULT 'ARS',
  settings      JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `subscription_plans` — Planes disponibles

```sql
CREATE TABLE subscription_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         plan_type NOT NULL UNIQUE,
  price_ars    NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_branches INT NOT NULL DEFAULT 1,
  max_users    INT NOT NULL DEFAULT 2,
  features     JSONB NOT NULL DEFAULT '{}',
  mp_plan_id   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `subscriptions` — Vínculo org ↔ Mercado Pago

```sql
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id              UUID NOT NULL REFERENCES subscription_plans(id),
  status               subscription_status NOT NULL DEFAULT 'trialing',
  mp_subscription_id   TEXT UNIQUE,
  mp_payer_id          TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `profiles` — Extiende auth.users

```sql
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  avatar_url     TEXT,
  phone          TEXT,
  dni            TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  preferences    JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Trigger: auto-create profile en auth.users INSERT
```

#### `organization_members` — Miembros y roles por org

```sql
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'cashier',
  branch_id       UUID,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by      UUID REFERENCES auth.users(id),
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### `branches` — Sucursales por organización

```sql
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  is_main         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  settings        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE organization_members
  ADD CONSTRAINT fk_om_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
```

#### `product_categories` — Árbol de categorías

```sql
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
```

#### `products` — Catálogo de productos

```sql
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
```

#### `price_history` — Historial de cambios de precio (trigger automático)

```sql
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
```

#### `suppliers` — Proveedores

```sql
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
```

#### `supplier_products` — Relación proveedor ↔ producto

```sql
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
```

#### `customers` — Clientes

```sql
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
```

#### `cash_sessions` — Sesiones de caja (apertura/cierre)

```sql
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
CREATE UNIQUE INDEX idx_cash_sessions_one_open ON cash_sessions(branch_id) WHERE status = 'open';
```

#### `cash_movements` — Movimientos de caja

```sql
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
```

#### `sales` — Ventas

```sql
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
```

#### `sale_items` — Líneas de venta (snapshot en momento de venta)

```sql
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
```

#### `pending_sales` — Ventas en espera (Multi-Venta)

```sql
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
```

#### `invoices` — Facturas (ARCA fiscal y no fiscal)

```sql
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
```

#### `expenses` — Gastos

```sql
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
```

#### `current_accounts` — Cuentas corrientes

```sql
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
```

#### `current_account_transactions` — Movimientos de cuenta corriente

```sql
CREATE TABLE current_account_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES current_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type            account_transaction_type NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  balance_after   NUMERIC(12,2) NOT NULL,
  description     TEXT,
  sale_id         UUID REFERENCES sales(id),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `stock_alerts` — Alertas de stock

```sql
CREATE TABLE stock_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type      alert_type NOT NULL DEFAULT 'low_stock',
  threshold       NUMERIC(12,3),
  current_stock   NUMERIC(12,3),
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `notifications` — Notificaciones in-app

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  type            alert_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `push_subscriptions` — Suscripciones a Web Push

```sql
CREATE TABLE push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth_key        TEXT NOT NULL,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### Triggers clave

```sql
-- 1. Auto-crear perfil en signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Registrar historial de precios automáticamente
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
CREATE TRIGGER trg_price_history
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.record_price_history();

-- 3. Alerta de stock bajo
CREATE OR REPLACE FUNCTION public.check_stock_alert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock_current <= NEW.stock_min AND NEW.track_stock THEN
    INSERT INTO public.stock_alerts
      (organization_id, product_id, alert_type, threshold, current_stock)
    VALUES (
      NEW.organization_id, NEW.id,
      CASE WHEN NEW.stock_current <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
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

-- 4. Actualizar balance de cuenta corriente
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.current_accounts
  SET balance = balance + NEW.amount, updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_account_balance
  AFTER INSERT ON current_account_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();
```

### Funciones RLS helper

```sql
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(is_super_admin, FALSE) FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS member_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM organization_members
  WHERE organization_id = org_id AND user_id = auth.uid() AND is_active = TRUE;
$$;
```

### Orden de migraciones

| Archivo | Contenido |
|---|---|
| `001_extensions.sql` | Habilitar extensiones de PostgreSQL |
| `002_enums.sql` | Todos los tipos ENUM |
| `003_core_tables.sql` | organizations, subscription_plans, subscriptions, profiles, organization_members, branches |
| `004_products.sql` | product_categories, products, price_history, suppliers, supplier_products |
| `005_customers.sql` | customers, current_accounts, current_account_transactions |
| `006_sales.sql` | cash_sessions, cash_movements, sales, sale_items, pending_sales, invoices, expenses |
| `007_alerts.sql` | stock_alerts, notifications, push_subscriptions |
| `008_triggers.sql` | Todos los triggers |
| `009_rls.sql` | Helper functions + todas las políticas RLS |
| `010_indexes.sql` | Índices de performance |
| `011_seed.sql` | Planes de suscripción por defecto (free_trial, basic, pro) |

---

## Estructura de Carpetas

```
venti/
├── app/
│   ├── (landing)/                          # Páginas públicas de marketing
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Homepage / Landing
│   │   ├── precios/page.tsx
│   │   ├── funcionalidades/page.tsx
│   │   └── contacto/page.tsx
│   │
│   ├── (auth)/                             # Flujo de autenticación (sin sidebar)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx               # Registro + creación de organización
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── invite/[token]/page.tsx
│   │
│   ├── (app)/                              # App principal (autenticada)
│   │   ├── layout.tsx                      # Sidebar + top nav
│   │   └── [orgSlug]/
│   │       ├── layout.tsx                  # Contexto de organización
│   │       ├── dashboard/page.tsx
│   │       │
│   │       ├── pos/                        # Punto de Venta
│   │       │   ├── page.tsx                # Pantalla principal POS
│   │       │   └── espera/page.tsx         # Ventas en espera
│   │       │
│   │       ├── productos/
│   │       │   ├── page.tsx
│   │       │   ├── nuevo/page.tsx
│   │       │   ├── [id]/page.tsx
│   │       │   ├── categorias/page.tsx
│   │       │   └── etiquetas/page.tsx      # Impresión de etiquetas
│   │       │
│   │       ├── ventas/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── facturacion/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── caja/
│   │       │   ├── page.tsx
│   │       │   └── historial/page.tsx
│   │       │
│   │       ├── clientes/
│   │       │   ├── page.tsx
│   │       │   ├── nuevo/page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── cuentas-corrientes/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── proveedores/
│   │       │   ├── page.tsx
│   │       │   ├── nuevo/page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── gastos/page.tsx
│   │       │
│   │       ├── reportes/
│   │       │   ├── page.tsx
│   │       │   ├── ventas/page.tsx
│   │       │   ├── stock/page.tsx
│   │       │   └── caja/page.tsx
│   │       │
│   │       ├── configuracion/
│   │       │   ├── page.tsx
│   │       │   ├── sucursales/page.tsx
│   │       │   ├── equipo/page.tsx
│   │       │   ├── facturacion/page.tsx    # Config ARCA
│   │       │   └── suscripcion/page.tsx
│   │       │
│   │       └── notificaciones/page.tsx
│   │
│   ├── (admin)/                            # Panel super-admin
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── organizaciones/page.tsx
│   │       ├── organizaciones/[id]/page.tsx
│   │       ├── suscripciones/page.tsx
│   │       ├── usuarios/page.tsx
│   │       └── planes/page.tsx
│   │
│   └── api/
│       ├── webhooks/
│       │   ├── mercadopago/route.ts
│       │   └── arca/route.ts
│       ├── arca/
│       │   ├── authorize/route.ts
│       │   └── verify/route.ts
│       ├── push/
│       │   ├── subscribe/route.ts
│       │   └── send/route.ts
│       ├── exports/
│       │   ├── sales/route.ts
│       │   └── stock/route.ts
│       └── labels/
│           └── print/route.ts
│
├── components/
│   ├── ui/                                 # shadcn/ui
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   ├── breadcrumbs.tsx
│   │   └── mobile-nav.tsx
│   ├── pos/
│   │   ├── barcode-scanner.tsx
│   │   ├── cart.tsx
│   │   ├── cart-item.tsx
│   │   ├── payment-modal.tsx
│   │   ├── customer-selector.tsx
│   │   └── hold-sale-button.tsx
│   ├── products/
│   │   ├── product-card.tsx
│   │   ├── product-form.tsx
│   │   ├── bulk-price-update.tsx
│   │   ├── price-history-chart.tsx
│   │   └── barcode-label.tsx
│   ├── dashboard/
│   │   ├── cash-summary-card.tsx
│   │   ├── sales-chart.tsx
│   │   ├── top-products-table.tsx
│   │   └── recent-sales.tsx
│   ├── invoices/
│   │   ├── invoice-form.tsx
│   │   ├── invoice-pdf.tsx
│   │   └── whatsapp-share.tsx
│   ├── notifications/
│   │   ├── notification-bell.tsx
│   │   └── stock-alert-toast.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── export-button.tsx
│       ├── search-input.tsx
│       └── confirm-dialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser client
│   │   ├── server.ts                       # Server client (cookies)
│   │   ├── admin.ts                        # Service role (solo en API routes)
│   │   └── middleware.ts
│   ├── arca/
│   │   ├── client.ts
│   │   ├── auth.ts                         # WSAA token management
│   │   ├── invoice.ts                      # FECAESolicitar
│   │   └── types.ts
│   ├── mercadopago/
│   │   ├── client.ts
│   │   ├── subscriptions.ts
│   │   └── webhooks.ts
│   ├── push/
│   │   └── web-push.ts
│   ├── offline/
│   │   ├── db.ts                           # Dexie schema
│   │   ├── sync.ts
│   │   └── queue.ts
│   └── utils/
│       ├── currency.ts                     # Formateo ARS
│       ├── barcode.ts
│       ├── export.ts
│       └── print.ts
│
├── hooks/
│   ├── use-barcode-scanner.ts              # USB HID + cámara
│   ├── use-offline.ts
│   ├── use-cash-session.ts
│   ├── use-org.ts
│   └── use-push-notifications.ts
│
├── stores/
│   ├── cart-store.ts                       # Zustand: carrito POS
│   ├── offline-store.ts
│   └── notification-store.ts
│
├── types/
│   ├── database.ts                         # Generado por Supabase CLI
│   ├── pos.ts
│   └── arca.ts
│
├── public/
│   ├── manifest.json                       # PWA
│   ├── sw.js                               # Service Worker
│   └── icons/
│
├── middleware.ts                           # Auth guard + org slug resolver
├── next.config.ts
├── tailwind.config.ts
└── CLAUDE.md
```

---

## Fases de Implementación

### Fase 0: Bootstrap (Semana 1)
- Inicializar Next.js 14 con TypeScript, Tailwind, shadcn/ui
- Configurar clientes Supabase (browser, server, admin)
- Configurar middleware para guards de auth y routing por org slug
- Ejecutar migraciones 001–011 en Supabase
- Configurar Zustand y TanStack Query
- Implementar dark/light mode con `next-themes`
- Deploy skeleton en Vercel

### Fase 1: Auth y Onboarding (Semana 1–2)
- Login / Registro con Supabase Auth
- Flujo de registro: usuario → organización → sucursal → suscripción (free trial)
- Setup de perfil
- Invitaciones de equipo vía email con token
- Guard de middleware: auth state + membresía de org
- Redirección super-admin a `/admin`

### Fase 2: POS Core — MVP (Semanas 2–4)
- Listado de productos con búsqueda (pg_trgm) y lookup por barcode
- Hook `use-barcode-scanner`:
  - USB HID: escuchar `keydown` con detección de velocidad (< 50ms entre caracteres = scanner)
  - Cámara: `@zxing/browser` BrowserMultiFormatReader en `<video>`
- Estado del carrito con Zustand
- Modal de pago: efectivo (con vuelto), tarjeta, transferencia
- Completar venta: insertar `sales` + `sale_items`, descontar stock, insertar `cash_movements`
- Ventas en espera: guardar carrito en `pending_sales`, restaurar al hacer clic
- Sesión de caja: apertura (monto inicial), cierre (reconciliación)
- Ticket: CSS `@media print` + link de WhatsApp vía `wa.me`

### Fase 3: Gestión de Productos (Semanas 3–4)
- Lista con paginación, búsqueda, filtro por categoría
- CRUD de productos
- Actualización masiva de precios por porcentaje
- Categorías de productos (árbol con `parent_id`)
- Gráfico de historial de precios (recharts LineChart)
- Gestión de stock: stock actual, umbral mínimo, ajuste manual
- Impresión de etiquetas PDF (`@react-pdf/renderer` + `jsbarcode`)
- Import de productos desde CSV

### Fase 4: Facturación ARCA (Semanas 4–6)
- Almacenar credenciales ARCA por organización (CUIT, punto de venta, certificado) en Supabase Vault
- Flujo WSAA: TRA XML firmado con CMS → endpoint SOAP → cachear TA (12h)
- WSFEV1: `FECompUltimoAutorizado` + `FECAESolicitar`
- Tipos: Factura A, B, C, Ticket, No fiscal
- QR ARCA estándar (JSON base64url → imagen QR)
- PDF con `@react-pdf/renderer` siguiendo layout fiscal argentino
- WhatsApp share: PDF → Supabase Storage → URL firmada → `wa.me`

### Fase 5: Proveedores, Clientes, Cuentas Corrientes (Semanas 5–6)
- CRUD de proveedores con validación CUIL/CUIT
- Vinculación proveedor ↔ producto
- CRUD de clientes con cuenta corriente opcional
- Cuenta corriente: cargar en venta, registrar pagos, ver saldo e historial
- Estado de cuenta en PDF/WhatsApp

### Fase 6: Dashboard y Reportes (Semanas 6–7)
- Dashboard: total del día, balance de caja, top 5 productos, gráfico ventas por hora (recharts AreaChart)
- Reporte de ventas: filtro por fecha, sucursal, cajero; agrupar por día/semana/mes
- Reporte de stock: stock actual, lista bajo stock, historial de movimientos
- Reporte de sesiones de caja
- Export CSV (`papaparse`) y XLSX (`exceljs`)
- Registro de gastos con categorías y breakdown

### Fase 7: Notificaciones y Alertas (Semanas 7–8)
- Almacenamiento de `push_subscriptions` vía Web Push API (VAPID)
- Hook `use-push-notifications`: pedir permiso, suscribir, guardar en DB
- Supabase Realtime en tabla `stock_alerts` → toast in-app + sonido (AudioContext)
- Edge Function `send-push`: en INSERT de stock_alert, enviar Web Push a todos los miembros de la org
- Centro de notificaciones en top nav con badge de no leídos

### Fase 8: Offline / PWA (Semanas 8–9)
- `manifest.json` + service worker (Workbox via `next-pwa`)
- Dexie.js: espejo local de `products`, `pending_sales`, `cash_sessions`
- POS offline-first: lee de IndexedDB, escribe a cola de sincronización
- Sync queue: al recuperar conexión, drenar mutaciones en orden
- Indicador de desconexión (banner/badge)

### Fase 9: Panel Super-Admin (Semanas 9–10)
- Ruta `(admin)` protegida por `is_super_admin` en middleware
- Dashboard: total orgs, suscripciones activas, MRR estimado
- Lista de organizaciones: buscar, filtrar por plan, ver / impersonar
- Gestión de suscripciones: upgrade/downgrade, cancelar, extender trial
- Gestión de usuarios y planes

### Fase 10: Landing Page (Semana 10)
- Hero con demo animado del POS
- Sección de features con íconos
- Sección de precios (cards de planes con CTA a `/registro`)
- FAQ, testimonios (estáticos inicialmente)
- SEO: metadata, OpenGraph, sitemap
- Footer con links legales

---

## Integraciones

### Mercado Pago

**Suscripciones:**
- Crear plan MP (mensual, en ARS) vía API al crear cada plan del sistema
- Al suscribir usuario: `POST /preapproval` → redirigir a URL de aprobación MP
- Guardar `mp_subscription_id` y `mp_payer_id` en tabla `subscriptions`
- Webhook `POST /api/webhooks/mercadopago`:
  - Verificar firma HMAC-SHA256 en header `X-Signature`
  - Eventos `payment`: actualizar estado de suscripción
  - Eventos `subscription_preapproval`: activar/cancelar org
- Usar SDK oficial `mercadopago` para Node.js

### ARCA (ex-AFIP)

**WSAA — Autenticación:**
- Certificado fiscal + clave privada por organización, almacenados en Supabase Vault
- Generar TRA XML, firmarlo con CMS usando `node-forge`
- POST SOAP a WSAA → recibir Token+Sign (cachear 12h)

**WSFEV1 — Factura Electrónica:**
- `FECompUltimoAutorizado`: obtener último número autorizado
- `FECAESolicitar`: solicitar CAE
- Guardar CAE en `invoices.cae` + `invoices.cae_vto`
- QR ARCA: JSON con datos del comprobante → base64url → imagen QR

**Ambiente de testing:**
- WSAA Homologación: `https://wsaahomo.afip.gov.ar/ws/services/LoginCms`
- WSFEV1 Homologación: `https://wswhomo.afip.gov.ar/wsfev1/service.asmx`

---

## Consideraciones Técnicas Clave

### Escáner de Código de Barras (USB HID)

Los lectores USB emiten caracteres muy rápido (< 50ms entre teclas) y terminan con `Enter`. Distinguirlos del tipeo normal del usuario:

```typescript
// hooks/use-barcode-scanner.ts
const SCAN_THRESHOLD_MS = 50;
let buffer = '';
let lastKeyTime = 0;

document.addEventListener('keydown', (e) => {
  const now = Date.now();
  if (e.key === 'Enter' && buffer.length >= 3) {
    onScan(buffer);
    buffer = '';
    return;
  }
  if (now - lastKeyTime > SCAN_THRESHOLD_MS * 3) buffer = '';
  buffer += e.key;
  lastKeyTime = now;
});
```

### Offline con IndexedDB

```typescript
// lib/offline/db.ts (Dexie)
db.version(1).stores({
  products: 'id, barcode, organization_id, name',
  pending_sales: 'id, organization_id, branch_id',
  cash_sessions: 'id, branch_id, status',
  sync_queue: '++id, table_name, operation, created_at',
});
```

Estrategia de sync: idempotency keys (UUID generado en cliente), `ON CONFLICT DO NOTHING` en Supabase.

### Alertas de Stock con Sonido

```typescript
// Al recibir alerta via Supabase Realtime:
const audioCtx = new AudioContext();
const osc = audioCtx.createOscillator();
osc.frequency.value = 880;
osc.connect(audioCtx.destination);
osc.start();
osc.stop(audioCtx.currentTime + 0.3);
```

### Seguridad Multi-Tenant

- Todo acceso a datos filtra por `organization_id` vía RLS
- `SECURITY DEFINER` solo en funciones helper de RLS
- Nunca exponer `service_role` key al cliente
- Super-admin opera vía API routes con `admin.ts` (service role)
- Cashiers no pueden ver reportes ni editar precios (RLS + UI)

### WhatsApp Share de Facturas

1. Generar PDF → subir a Supabase Storage (`invoices/`, privado)
2. Generar URL firmada (24h de validez)
3. Construir: `https://wa.me/?text=Hola! Te compartimos tu comprobante: <url_firmada>`
4. Abrir en nueva pestaña (en mobile abre WhatsApp directamente)

---

## Convenciones de Código

- **Idioma**: UI/textos en español, código (variables, funciones, tipos) en inglés
- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase con prefijo `use-` (`use-barcode-scanner.ts`)
- **API routes**: kebab-case en directorios, `route.ts` como archivo
- **Supabase queries**: siempre en Server Components o API routes, nunca en Client Components directamente (excepto suscripciones Realtime)
- **Zod schemas**: definir en `lib/validations/`, reusar entre frontend y backend
- **Tipos de DB**: usar tipos generados por `supabase gen types typescript` en `types/database.ts`
- **Formateo de pesos**: siempre usar `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
- **Fechas**: siempre trabajar en timezone `America/Argentina/Buenos_Aires` usando `date-fns-tz`
- **Colores del sistema**: verde (#22c55e) para positivos/activo, rojo (#ef4444) para negativos/alerta, slate como base

---

## Design System

- **Fuente**: Inter (Google Fonts)
- **Paleta base**: slate (gray)
- **Acento**: emerald/green (tono amigable, fresco — acorde al nombre Venti)
- **Radios**: `rounded-xl` para cards, `rounded-lg` para inputs/botones
- **Sombras**: sutiles, solo en cards flotantes
- **Responsive breakpoints**: `sm` = tablet pequeña, `md` = tablet, `lg` = desktop
- **POS mobile**: UI full-screen optimizada para una mano en móvil
- **Iconografía**: Lucide React (consistente con shadcn/ui)
- **Tono de voz**: amigable, directo, en segunda persona singular ("Tu caja", "Tus productos", "Vendiste X hoy")


## Reglas de trabajo (ahorrar tokens y ser preciso)

1. **No programar sin contexto** — Leer archivos relevantes antes de escribir código. Si falta contexto, preguntar.
2. **Respuestas cortas** — 1-3 oraciones. Sin preámbulos ni resumen final. El código habla solo.
3. **No reescribir archivos completos** — Usar Edit (parcial). Write solo si el cambio es >80% del archivo.
4. **No releer archivos ya leídos** — Si ya se leyó en esta conversación, no volver a leer salvo que haya cambiado.
5. **Validar antes de declarar hecho** — Compilar, correr tests o verificar. Nunca decir "listo" sin evidencia.
6. **Cero adulación** — No decir "Excelente pregunta", "Gran idea", etc. Ir directo al trabajo.
7. **Soluciones simples** — Mínimo que resuelve el problema. Sin abstracciones, helpers ni features no pedidos.
8. **No pelear con el usuario** — Si el usuario dice "hacelo así", hacerlo. Mencionar concern en 1 oración máximo.
9. **Leer solo lo necesario** — Usar offset/limit. Si se sabe la ruta exacta, Read directo sin Glob+Grep previo.
10. **No narrar el plan** — No describir lo que se va a hacer. Solo hacerlo. El usuario ve los tool calls.
11. **Paralelizar tool calls** — Leer múltiples archivos independientes en un solo mensaje.
12. **No duplicar código en la respuesta** — Si ya se editó un archivo, no copiarlo en texto también.
13. **No usar Agent cuando Grep/Read basta** — Agent solo para búsquedas amplias o tareas complejas.