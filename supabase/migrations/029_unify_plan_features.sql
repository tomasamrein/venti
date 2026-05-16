-- Unificación de planes: todas las features ON en todos los planes pagos.
-- La diferenciación es por ESCALA (max_branches, max_users), no por features.
-- Justificación: vendemos por tamaño de negocio, no por features cortadas.

-- Trial: 14 días, sin restricciones de features
UPDATE subscription_plans SET
  name = 'Prueba gratis',
  price_ars = 0,
  max_branches = 1,
  max_users = 2,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', false, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'ai_chat', true, 'wa_support', true,
    'trial_days', 14
  )
WHERE type = 'free_trial';

-- Simple: 1 sucursal, 2 usuarios — todas las features
UPDATE subscription_plans SET
  name = 'Simple',
  price_ars = 30000,
  max_branches = 1,
  max_users = 2,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', false, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'ai_chat', true, 'wa_support', true,
    'trial_days', 14
  )
WHERE type = 'basic';

-- Avanzado: 1 sucursal, usuarios ilimitados — todas las features
UPDATE subscription_plans SET
  name = 'Avanzado',
  price_ars = 50000,
  max_branches = 1,
  max_users = 999,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', false, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'priority_support', true,
    'ai_chat', true, 'wa_support', true, 'trial_days', 14
  )
WHERE type = 'pro';

-- Profesional: multi-sucursal, usuarios ilimitados
UPDATE subscription_plans SET
  name = 'Profesional',
  price_ars = 100000,
  max_branches = 999,
  max_users = 999,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', true, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'priority_support', true, 'onboarding', true,
    'ai_chat', true, 'wa_support', true, 'trial_days', 14
  )
WHERE type = 'professional';

-- Simple Anual: igual a Simple pero con descuento anual
UPDATE subscription_plans SET
  name = 'Simple Anual',
  price_ars = 270000,
  max_branches = 1,
  max_users = 2,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', false, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'ai_chat', true, 'wa_support', true,
    'annual', true
  )
WHERE type = 'basic_annual';

-- Avanzado Anual
UPDATE subscription_plans SET
  name = 'Avanzado Anual',
  price_ars = 450000,
  max_branches = 1,
  max_users = 999,
  features = jsonb_build_object(
    'pos', true, 'products', true, 'invoices', true, 'reports', true,
    'multi_branch', false, 'current_accounts', true, 'export_sales', true,
    'suppliers', true, 'price_history', true, 'team_management', true,
    'push_notifications', true, 'priority_support', true,
    'ai_chat', true, 'wa_support', true, 'annual', true
  )
WHERE type = 'pro_annual';
