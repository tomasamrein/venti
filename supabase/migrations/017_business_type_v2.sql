-- Update business_type constraint: remove polleria/ferreteria, add almacen/drugstore
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_business_type_check;

UPDATE public.organizations
  SET business_type = 'otro'
  WHERE business_type IN ('polleria', 'ferreteria');

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_business_type_check
  CHECK (business_type IN ('kiosco', 'almacen', 'drugstore', 'fotocopiadora', 'otro'));

COMMENT ON COLUMN public.organizations.business_type IS
  'Tipo de negocio: kiosco, almacen, drugstore, fotocopiadora, otro';
