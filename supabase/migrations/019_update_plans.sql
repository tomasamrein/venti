-- Rename and reprice existing plans + add Avanzado tier to match new branding

ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'avanzado';

UPDATE subscription_plans SET name = 'Esencial', price_ars = 50000  WHERE type = 'basic';
UPDATE subscription_plans SET name = 'Premium',  price_ars = 100000 WHERE type = 'pro';

INSERT INTO subscription_plans (name, type, price_ars, max_branches, max_users, features)
VALUES (
  'Avanzado',
  'avanzado',
  80000,
  1,
  999,
  '{"pos": true, "products": true, "invoices": true, "reports": true, "multi_branch": false, "current_accounts": true, "service_module": true, "price_history": true, "advanced_reports": false, "push_notifications": false, "trial_days": 14}'
)
ON CONFLICT DO NOTHING;
