CREATE TABLE IF NOT EXISTS invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       CITEXT NOT NULL,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'cashier',
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS: public can read by token (needed for invite page)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_read_by_token" ON invitations
  FOR SELECT USING (true);

CREATE POLICY "invite_insert_by_member" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND is_active = TRUE
        AND role IN ('owner', 'admin')
    )
  );
