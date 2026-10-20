-- Cierra el acceso de los roles anon y authenticated a tablas con políticas USING (true).
-- El backend usa SUPABASE_SERVICE_ROLE_KEY, que salta RLS, así que no necesita estas políticas.
-- Con RLS activo y sin políticas, anon y authenticated no ven ni modifican filas.
-- Idempotente: IF EXISTS permite reejecutarla sin error.

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_cartel_estilo;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_letras_auto;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_print_settings;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.calendar_conflict_notifications;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.letras_jobs;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.pegatinas_pedidos;
DROP POLICY IF EXISTS "Permitir acceso total al backend en pitch_vector_store" ON public.pitch_vector_store;
DROP POLICY IF EXISTS "Permitir acceso total al backend para concert_deals" ON public.concert_deals;
DROP POLICY IF EXISTS "Permitir acceso total al backend para deal_support_contribution" ON public.deal_support_contributions;
DROP POLICY IF EXISTS "Permitir gestión de campañas a miembros de la banda" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public insert to fan_link_clicks" ON public.fan_link_clicks;
