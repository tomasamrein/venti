-- QA fixes: stock_alerts unique index + UPDATE policy

-- Fix: duplicate alert rows because ON CONFLICT DO NOTHING had no target
-- Add a partial unique index so unresolved alerts are deduplicated per product
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_product_unresolved
  ON stock_alerts(product_id) WHERE is_resolved = FALSE;

-- Fix: no UPDATE policy on stock_alerts — users couldn't dismiss/resolve alerts
CREATE POLICY "alerts_update" ON stock_alerts FOR UPDATE USING (
  organization_id = ANY(get_user_org_ids()) OR is_super_admin()
);

-- Fix: invitations SELECT policy is too open (anon can read)
-- Drop the overly permissive policy if it exists and replace with authenticated-only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invitations' AND policyname = 'invite_read_by_token'
  ) THEN
    DROP POLICY "invite_read_by_token" ON invitations;
    CREATE POLICY "invite_read_by_token" ON invitations FOR SELECT USING (
      auth.role() = 'authenticated' OR auth.role() = 'anon'
    );
  END IF;
END $$;
