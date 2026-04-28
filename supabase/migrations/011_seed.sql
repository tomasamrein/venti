INSERT INTO subscription_plans (name, type, price_ars, max_branches, max_users, features) VALUES
(
  'Prueba Gratuita',
  'free_trial',
  0,
  1,
  2,
  '{"pos": true, "products": true, "invoices": false, "reports": false, "multi_branch": false, "current_accounts": false, "trial_days": 7}'
),
(
  'Single',
  'basic',
  49999,
  1,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": false, "current_accounts": true, "trial_days": 7}'
),
(
  'Enterprise',
  'pro',
  99999,
  999,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": true, "current_accounts": true, "advanced_reports": true, "push_notifications": true, "priority_support": true, "onboarding": true}'
);
