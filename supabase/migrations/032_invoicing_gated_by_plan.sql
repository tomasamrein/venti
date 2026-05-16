-- Re-introduce ARCA invoicing as a paid-tier feature.
-- Simple (basic / basic_annual) no incluye facturación ARCA.
-- Trial incluye facturación (para que el usuario pueda probarla durante 14 días).
-- Avanzado, Avanzado Anual y Profesional sí incluyen ARCA.

UPDATE subscription_plans
  SET features = features || jsonb_build_object('invoices', false)
  WHERE type IN ('basic', 'basic_annual');

UPDATE subscription_plans
  SET features = features || jsonb_build_object('invoices', true)
  WHERE type IN ('free_trial', 'pro', 'pro_annual', 'professional');
