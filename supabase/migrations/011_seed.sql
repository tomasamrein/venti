INSERT INTO subscription_plans (name, type, price_ars, max_branches, max_users, features) VALUES
(
  'Prueba Gratuita',
  'free_trial',
  0,
  1,
  2,
  '{"pos": true, "products": true, "invoices": false, "reports": false, "multi_branch": false, "current_accounts": false}'
),
(
  'Basic',
  'basic',
  15000,
  1,
  3,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": false, "current_accounts": true}'
),
(
  'Pro',
  'pro',
  35000,
  10,
  20,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": true, "current_accounts": true, "advanced_reports": true, "api_access": true}'
);
