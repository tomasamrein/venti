-- Performance indexes

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;

-- organization_members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_active ON organization_members(user_id, organization_id) WHERE is_active = TRUE;

-- branches
CREATE INDEX IF NOT EXISTS idx_branches_org ON branches(organization_id) WHERE is_active = TRUE;

-- products (idx_products_barcode, idx_products_org, idx_products_name_trgm already in 004)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(organization_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(organization_id, stock_current, stock_min)
  WHERE track_stock = TRUE;

-- price_history
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_org ON price_history(organization_id, changed_at DESC);

-- suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id) WHERE is_active = TRUE;

-- supplier_products
CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);

-- customers (idx_customers_phone, idx_customers_name_trgm already in 005)
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_customers_has_account ON customers(organization_id) WHERE has_account = TRUE;

-- current_accounts
CREATE INDEX IF NOT EXISTS idx_current_accounts_customer ON current_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_current_accounts_org ON current_accounts(organization_id);

-- current_account_transactions
CREATE INDEX IF NOT EXISTS idx_cat_account ON current_account_transactions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cat_org ON current_account_transactions(organization_id, created_at DESC);

-- cash_sessions
CREATE INDEX IF NOT EXISTS idx_cash_sessions_org ON cash_sessions(organization_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_branch ON cash_sessions(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_by ON cash_sessions(opened_by);

-- cash_movements
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_org ON cash_movements(organization_id, created_at DESC);

-- sales (idx_sales_org_created, idx_sales_customer already in 006)
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(organization_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(organization_id, sale_number);

-- sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_items_org ON sale_items(organization_id, created_at DESC);

-- pending_sales
CREATE INDEX IF NOT EXISTS idx_pending_sales_org ON pending_sales(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_sales_session ON pending_sales(session_id) WHERE session_id IS NOT NULL;

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_cae ON invoices(cae) WHERE cae IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(organization_id, status);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_session ON expenses(session_id) WHERE session_id IS NOT NULL;

-- stock_alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_org ON stock_alerts(organization_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved ON stock_alerts(organization_id)
  WHERE is_resolved = FALSE;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id)
  WHERE is_read = FALSE;

-- push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_org ON push_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp ON subscriptions(mp_subscription_id) WHERE mp_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- updated_at indexes for moddatetime efficiency
CREATE INDEX IF NOT EXISTS idx_organizations_updated ON organizations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_updated ON sales(updated_at DESC);
