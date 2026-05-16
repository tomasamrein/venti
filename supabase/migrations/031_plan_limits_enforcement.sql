-- Enforcement server-side de límites de plan + protección de rol owner.
-- Garantiza que ningún cliente puede bypassear los límites llamando directo a la API.

CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    RAISE EXCEPTION 'No se puede cambiar el rol del dueño'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_role ON organization_members;
CREATE TRIGGER trg_protect_owner_role
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_role();

CREATE OR REPLACE FUNCTION public.enforce_max_users()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_max_users INT;
  v_current_users INT;
BEGIN
  IF NEW.is_active = FALSE THEN RETURN NEW; END IF;

  SELECT sp.max_users INTO v_max_users
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
  ORDER BY s.created_at DESC LIMIT 1;

  IF v_max_users IS NULL THEN v_max_users := 2; END IF;

  SELECT COUNT(*) INTO v_current_users
  FROM organization_members
  WHERE organization_id = NEW.organization_id
    AND is_active = TRUE
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_current_users >= v_max_users THEN
    RAISE EXCEPTION 'Tu plan permite hasta % usuarios. Actualizá tu plan para agregar más.', v_max_users
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_users_insert ON organization_members;
CREATE TRIGGER trg_enforce_max_users_insert
  BEFORE INSERT ON organization_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_users();

DROP TRIGGER IF EXISTS trg_enforce_max_users_update ON organization_members;
CREATE TRIGGER trg_enforce_max_users_update
  BEFORE UPDATE OF is_active ON organization_members
  FOR EACH ROW
  WHEN (OLD.is_active = FALSE AND NEW.is_active = TRUE)
  EXECUTE FUNCTION public.enforce_max_users();

CREATE OR REPLACE FUNCTION public.enforce_max_branches()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_max_branches INT;
  v_current_branches INT;
BEGIN
  IF NEW.is_active = FALSE THEN RETURN NEW; END IF;

  SELECT sp.max_branches INTO v_max_branches
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.organization_id = NEW.organization_id
  ORDER BY s.created_at DESC LIMIT 1;

  IF v_max_branches IS NULL THEN v_max_branches := 1; END IF;

  SELECT COUNT(*) INTO v_current_branches
  FROM branches
  WHERE organization_id = NEW.organization_id
    AND is_active = TRUE
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_current_branches >= v_max_branches THEN
    RAISE EXCEPTION 'Tu plan permite hasta % sucursal(es). Actualizá tu plan para agregar más.', v_max_branches
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_branches_insert ON branches;
CREATE TRIGGER trg_enforce_max_branches_insert
  BEFORE INSERT ON branches
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_branches();

DROP TRIGGER IF EXISTS trg_enforce_max_branches_update ON branches;
CREATE TRIGGER trg_enforce_max_branches_update
  BEFORE UPDATE OF is_active ON branches
  FOR EACH ROW
  WHEN (OLD.is_active = FALSE AND NEW.is_active = TRUE)
  EXECUTE FUNCTION public.enforce_max_branches();
