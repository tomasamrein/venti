-- Habilitar Supabase Realtime (postgres_changes) en las tablas que necesitan
-- reflejarse al instante entre dispositivos: stock/precios, ventas y caja.
--
-- REPLICA IDENTITY FULL es necesario para que los filtros por organization_id
-- funcionen en eventos UPDATE/DELETE (sin esto el payload solo trae la PK y el
-- filtro server-side por organization_id no matchea). RLS se sigue aplicando:
-- cada cliente solo recibe filas de sus organizaciones.

ALTER TABLE public.products       REPLICA IDENTITY FULL;
ALTER TABLE public.sales          REPLICA IDENTITY FULL;
ALTER TABLE public.cash_sessions  REPLICA IDENTITY FULL;
ALTER TABLE public.cash_movements REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_movements;
