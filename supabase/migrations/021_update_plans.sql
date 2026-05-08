-- Add 'professional' to plan_type enum
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'professional';

-- Update existing plans
UPDATE subscription_plans SET
  name = 'Simple',
  price_ars = 30000,
  max_branches = 1,
  max_users = 2,
  features = '{"pos": true, "products": true, "invoices": false, "reports": false, "multi_branch": false, "current_accounts": true, "export_sales": true, "ai_chat": true, "wa_support": true, "trial_days": 14}'
WHERE type = 'basic';

UPDATE subscription_plans SET
  name = 'Avanzado',
  price_ars = 50000,
  max_branches = 1,
  max_users = 999,
  features = '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": false, "current_accounts": true, "export_sales": true, "suppliers": true, "price_history": true, "ai_chat": true, "wa_support": true, "trial_days": 14}'
WHERE type = 'pro';

-- Insert Profesional plan (upsert by type)
INSERT INTO subscription_plans (name, type, price_ars, max_branches, max_users, features)
VALUES (
  'Profesional',
  'professional',
  100000,
  999,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": true, "current_accounts": true, "export_sales": true, "suppliers": true, "price_history": true, "team_management": true, "push_notifications": true, "priority_support": true, "ai_chat": true, "wa_support": true, "trial_days": 14}'
)
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  price_ars = EXCLUDED.price_ars,
  max_branches = EXCLUDED.max_branches,
  max_users = EXCLUDED.max_users,
  features = EXCLUDED.features;
