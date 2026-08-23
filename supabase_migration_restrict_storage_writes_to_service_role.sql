-- =========================================================================
-- RESTRINGIR ESCRITURA DEL BUCKET band-media A LA SERVICE_ROLE KEY
-- APLICADA EN PRODUCCIÓN (2026-08-23)
-- =========================================================================
-- Contexto: supabase_migration_only_new.sql dejó el bucket `band-media`
-- (media pública del EPK/dossier) con cuatro políticas sobre
-- storage.objects: SELECT público (intencional — sirve fotos/audio/PDF del
-- EPK a quien visita /epk sin login) e INSERT/UPDATE/DELETE también
-- abiertos a `public`, es decir, a la anon key. El frontend no usa
-- @supabase/supabase-js en ningún sitio (confirmado al hacer el mismo
-- arreglo en las tablas — ver supabase_migration_restrict_rls_to_service_role.sql),
-- así que toda subida/edición/borrado de media ya pasa por el backend,
-- que usa SUPABASE_SERVICE_ROLE_KEY. La anon key no necesita poder
-- escribir en el bucket, solo leerlo.
--
-- No se asumen los nombres de política del fichero de origen (ya
-- divergieron de producción una vez con las tablas de `leads`/`users` —
-- ver el fichero de RLS de arriba): esto busca dinámicamente en
-- pg_policies cualquier política sobre storage.objects que mencione
-- 'band-media' y cuyo comando NO sea SELECT, y la elimina. El SELECT
-- público se deja intacto explícitamente.
--
-- REQUISITO PREVIO: el backend en Railway ya confirmado usando
-- SUPABASE_SERVICE_ROLE_KEY (ver supabase_migration_restrict_rls_to_service_role.sql).
-- Sin eso, esto le quita al backend la capacidad de subir media.
--
-- Confirmado antes de aplicar: producción tenía SEIS políticas sobre
-- storage.objects mencionando band-media, no cuatro — dos SELECT
-- ("Public Access band-media" y "Policies bucket mo5s98_0", esta última
-- generada por el propio panel de Studio al crear el bucket, sin
-- corresponder a ningún CREATE POLICY del repo) y cuatro de escritura
-- ("Allow All Uploads/Updates/Deletes band-media" + "Policies bucket
-- mo5s98_1" como el INSERT del panel). El DO block de abajo las cazó
-- todas por buscar dinámicamente en pg_policies en vez de asumir nombres.
-- =========================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual ILIKE '%band-media%' OR with_check ILIKE '%band-media%')
      AND cmd <> 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

-- Verificación tras aplicar (comprobado en producción): quedan solo las
-- dos políticas de SELECT ("Public Access band-media" y "Policies bucket
-- mo5s98_0"), las cuatro de escritura han desaparecido.
--
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND (qual ILIKE '%band-media%' OR with_check ILIKE '%band-media%');
