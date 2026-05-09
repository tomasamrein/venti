-- Move existing ARCA cert/key plaintext from organizations.settings to Supabase Vault

DO $$
DECLARE
  org_rec RECORD;
  v_cert_pem TEXT;
  v_key_pem  TEXT;
  v_cert_id  UUID;
  v_key_id   UUID;
  v_arca     JSONB;
BEGIN
  FOR org_rec IN
    SELECT id, settings
    FROM organizations
    WHERE settings->'arca'->>'cert_pem' IS NOT NULL
  LOOP
    v_arca     := org_rec.settings->'arca';
    v_cert_pem := v_arca->>'cert_pem';
    v_key_pem  := v_arca->>'key_pem';

    v_cert_id := vault.create_secret(v_cert_pem, 'arca_cert_' || org_rec.id::text);

    IF v_key_pem IS NOT NULL THEN
      v_key_id := vault.create_secret(v_key_pem, 'arca_key_' || org_rec.id::text);
    END IF;

    -- Strip plaintext, store vault secret IDs
    v_arca := (v_arca - 'cert_pem' - 'key_pem')
      || jsonb_build_object(
           'vault_cert_id', v_cert_id::text,
           'vault_key_id',  COALESCE(v_key_id::text, NULL)
         );

    UPDATE organizations
    SET settings = jsonb_set(settings, '{arca}', v_arca)
    WHERE id = org_rec.id;
  END LOOP;
END;
$$;

-- Read function: returns decrypted cert+key for a given org
CREATE OR REPLACE FUNCTION public.get_arca_cert_key(p_org_id UUID)
RETURNS TABLE (cert_pem TEXT, key_pem TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_cert_id UUID;
  v_key_id  UUID;
BEGIN
  SELECT
    (settings->'arca'->>'vault_cert_id')::UUID,
    (settings->'arca'->>'vault_key_id')::UUID
  INTO v_cert_id, v_key_id
  FROM organizations WHERE id = p_org_id;

  RETURN QUERY
  SELECT
    (SELECT ds.decrypted_secret FROM vault.decrypted_secrets ds WHERE ds.id = v_cert_id),
    (SELECT ds.decrypted_secret FROM vault.decrypted_secrets ds WHERE ds.id = v_key_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_arca_cert_key FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_arca_cert_key TO service_role;

-- Write function: upserts cert+key in vault and returns their secret IDs
CREATE OR REPLACE FUNCTION public.set_arca_vault_creds(
  p_org_id   UUID,
  p_cert_pem TEXT,
  p_key_pem  TEXT
)
RETURNS TABLE (vault_cert_id UUID, vault_key_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_existing_cert_id UUID;
  v_existing_key_id  UUID;
  v_cert_id UUID;
  v_key_id  UUID;
BEGIN
  SELECT
    (settings->'arca'->>'vault_cert_id')::UUID,
    (settings->'arca'->>'vault_key_id')::UUID
  INTO v_existing_cert_id, v_existing_key_id
  FROM organizations WHERE id = p_org_id;

  IF v_existing_cert_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing_cert_id, p_cert_pem);
    v_cert_id := v_existing_cert_id;
  ELSE
    v_cert_id := vault.create_secret(p_cert_pem, 'arca_cert_' || p_org_id::text);
  END IF;

  IF v_existing_key_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing_key_id, p_key_pem);
    v_key_id := v_existing_key_id;
  ELSE
    v_key_id := vault.create_secret(p_key_pem, 'arca_key_' || p_org_id::text);
  END IF;

  RETURN QUERY SELECT v_cert_id, v_key_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_arca_vault_creds FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_arca_vault_creds TO service_role;
