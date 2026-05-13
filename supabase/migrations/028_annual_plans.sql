ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'basic_annual';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'pro_annual';

INSERT INTO subscription_plans (name, type, price_ars, max_branches, max_users, features) VALUES
(
  'Simple Anual',
  'basic_annual',
  449991,
  1,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": false, "current_accounts": true, "annual": true}'
),
(
  'Profesional Anual',
  'pro_annual',
  899991,
  999,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": true, "current_accounts": true, "advanced_reports": true, "push_notifications": true, "priority_support": true, "onboarding": true, "annual": true}'
);
