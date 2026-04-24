-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ARRAY(
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(is_super_admin, FALSE) FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS member_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM organization_members
  WHERE organization_id = org_id AND user_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY "org_read" ON organizations FOR SELECT USING (
  id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "org_write" ON organizations FOR ALL USING (is_super_admin());
CREATE POLICY "owner_update_org" ON organizations FOR UPDATE USING (
  get_user_role(id) = 'owner'
);

-- subscription_plans (public read)
CREATE POLICY "plans_public_read" ON subscription_plans FOR SELECT USING (TRUE);

-- subscriptions
CREATE POLICY "sub_read" ON subscriptions FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- profiles
CREATE POLICY "profiles_own" ON profiles FOR SELECT USING (id = auth.uid() OR is_super_admin());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- organization_members
CREATE POLICY "members_read" ON organization_members FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "members_write" ON organization_members FOR ALL USING (
  get_user_role(organization_id) IN ('owner', 'admin') OR is_super_admin()
);

-- branches
CREATE POLICY "branches_read" ON branches FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "branches_write" ON branches FOR ALL USING (
  get_user_role(organization_id) = 'owner' OR is_super_admin()
);

-- product_categories
CREATE POLICY "categories_read" ON product_categories FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "categories_write" ON product_categories FOR ALL USING (
  get_user_role(organization_id) IN ('owner', 'admin') OR is_super_admin()
);

-- products
CREATE POLICY "products_read" ON products FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "products_write" ON products FOR ALL USING (
  get_user_role(organization_id) IN ('owner', 'admin') OR is_super_admin()
);

-- price_history
CREATE POLICY "price_history_read" ON price_history FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- suppliers
CREATE POLICY "suppliers_read" ON suppliers FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "suppliers_write" ON suppliers FOR ALL USING (
  get_user_role(organization_id) IN ('owner', 'admin') OR is_super_admin()
);

-- supplier_products
CREATE POLICY "supplier_products_read" ON supplier_products FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "supplier_products_write" ON supplier_products FOR ALL USING (
  get_user_role(organization_id) IN ('owner', 'admin') OR is_super_admin()
);

-- customers
CREATE POLICY "customers_read" ON customers FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "customers_write" ON customers FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- current_accounts
CREATE POLICY "accounts_read" ON current_accounts FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "accounts_write" ON current_accounts FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- current_account_transactions
CREATE POLICY "account_txn_read" ON current_account_transactions FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "account_txn_insert" ON current_account_transactions FOR INSERT WITH CHECK (
  organization_id = ANY(get_user_org_ids())
);

-- cash_sessions
CREATE POLICY "sessions_read" ON cash_sessions FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "sessions_write" ON cash_sessions FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- cash_movements
CREATE POLICY "movements_read" ON cash_movements FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "movements_insert" ON cash_movements FOR INSERT WITH CHECK (
  organization_id = ANY(get_user_org_ids())
);

-- sales
CREATE POLICY "sales_read" ON sales FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "sales_write" ON sales FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- sale_items
CREATE POLICY "sale_items_read" ON sale_items FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (
  organization_id = ANY(get_user_org_ids())
);

-- pending_sales
CREATE POLICY "pending_read" ON pending_sales FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "pending_write" ON pending_sales FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- invoices
CREATE POLICY "invoices_read" ON invoices FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "invoices_write" ON invoices FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- expenses
CREATE POLICY "expenses_read" ON expenses FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "expenses_write" ON expenses FOR ALL USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- stock_alerts
CREATE POLICY "alerts_read" ON stock_alerts FOR SELECT USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- notifications
CREATE POLICY "notif_read" ON notifications FOR SELECT USING (
  (organization_id = ANY(get_user_org_ids()) AND (user_id IS NULL OR user_id = auth.uid()))
  OR is_super_admin()
);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- push_subscriptions
CREATE POLICY "push_own" ON push_subscriptions FOR ALL USING (
  user_id = auth.uid() OR is_super_admin()
);
