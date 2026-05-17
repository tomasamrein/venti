-- Security hardening: address all warnings from Supabase advisor
-- 1. Drop broad SELECT policy on product-images (public bucket — URLs work without it)
-- 2. Pin search_path on SECURITY DEFINER trigger functions (prevents schema-hijacking)
-- 3. Revoke EXECUTE on internal trigger functions from anon/authenticated (they shouldn't be callable via /rest/v1/rpc)

-- ── 1. Storage: remove broad listing on product-images ──────────────────────
DROP POLICY IF EXISTS product_images_select ON storage.objects;

-- ── 2. Pin search_path on functions flagged as mutable ──────────────────────
ALTER FUNCTION public.record_price_history()       SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_stock_alert_push()    SET search_path = public, pg_temp;
ALTER FUNCTION public.update_account_balance()     SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_max_branches()       SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_max_users()          SET search_path = public, pg_temp;
ALTER FUNCTION public.protect_owner_role()         SET search_path = public, pg_temp;

-- Also pin on the RLS helpers (they were not flagged but it's free hardening)
ALTER FUNCTION public.get_user_org_ids()           SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin()             SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_role(uuid)          SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()            SET search_path = public, pg_temp;
ALTER FUNCTION public.check_stock_alert()          SET search_path = public, pg_temp;
ALTER FUNCTION public.next_non_fiscal_number(uuid, uuid, public.invoice_type) SET search_path = public, pg_temp;

-- ── 3. Revoke EXECUTE on internal trigger functions ─────────────────────────
-- These functions run from triggers as SECURITY DEFINER and should never be
-- exposed via the REST API. Revoking from PUBLIC (which includes anon and
-- authenticated) makes them un-callable from the client.
REVOKE EXECUTE ON FUNCTION public.record_price_history()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_stock_alert_push() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_account_balance()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_max_branches()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_max_users()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_owner_role()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_stock_alert()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()         FROM PUBLIC, anon, authenticated;

-- RLS helpers (get_user_org_ids, is_super_admin, get_user_role) ARE called
-- inside policies which run as the invoking user, so authenticated must keep
-- EXECUTE. next_non_fiscal_number is invoked from server actions only —
-- restrict to authenticated (no anon).
REVOKE EXECUTE ON FUNCTION public.next_non_fiscal_number(uuid, uuid, public.invoice_type) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.next_non_fiscal_number(uuid, uuid, public.invoice_type) TO authenticated;

-- RLS helpers — anon should never need them; only authenticated for policies
REVOKE EXECUTE ON FUNCTION public.get_user_org_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin()   FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
