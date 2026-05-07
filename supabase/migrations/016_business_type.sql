-- Add business_type to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'kiosco'
    CHECK (business_type IN ('kiosco', 'fotocopiadora', 'polleria', 'ferreteria', 'otro'));

COMMENT ON COLUMN public.organizations.business_type IS
  'Tipo de negocio: kiosco, fotocopiadora, polleria, ferreteria, otro';
