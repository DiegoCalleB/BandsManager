-- =========================================================================
-- RESTRINGIR RLS A LA SERVICE_ROLE KEY (2026-08-23)
-- =========================================================================
-- Contexto: todas las tablas tienen RLS activada, pero la política
-- "Permitir acceso total al backend" usa `USING (true)` sin restringir el
-- rol destinatario — en Postgres eso equivale a TO public, es decir, se
-- aplica también a `anon` y `authenticated`, no solo al backend. Como el
-- backend en Railway ha estado usando SUPABASE_ANON_KEY (ver
-- server/db/core.ts), cualquiera con esa key (semi-pública, va en el
-- bundle del frontend si se hubiera usado ahí) tenía lectura/escritura
-- total sobre TODAS las tablas, incluida `users` con hashes de contraseña.
--
-- El backend de este repo (server/) es el ÚNICO cliente que habla con
-- Supabase — el frontend (src/) no importa @supabase/supabase-js en
-- ningún sitio, todo pasa por la API Node. Por eso es seguro quitarle el
-- acceso a `anon`/`authenticated` por completo: basta con NO dejar
-- ninguna política para esos roles. El rol `service_role` de Postgres
-- tiene BYPASSRLS activado por defecto en Supabase, así que sigue
-- teniendo acceso total sin necesidad de una política propia — es
-- exactamente para eso para lo que existe SUPABASE_SERVICE_ROLE_KEY.
--
-- REQUISITO PREVIO (bloqueante): confirmar que el servicio en Railway ya
-- se ha redesplegado con SUPABASE_SERVICE_ROLE_KEY configurada y
-- respondiendo con normalidad ANTES de ejecutar esto. Si el backend
-- siguiera usando SUPABASE_ANON_KEY, esta migración lo deja sin acceso a
-- nada (leads, users, epk_configs... todo).
--
-- No toca las políticas del bucket de Storage `band-media` (definidas en
-- supabase_migration_only_new.sql) — esas se dejaron abiertas a propósito
-- para servir media pública del EPK, y tampoco las usa el frontend
-- directamente, pero es un cambio de alcance distinto y no forma parte de
-- este arreglo.
-- =========================================================================

BEGIN;

-- 1. Tablas de supabase_schema.sql con la política permisiva original.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'registered_bands','users','user_bands','leads','lead_messages','band_contacts',
    'setlists','rehearsals','concerts','epk_configs','fans','social_posts','payments',
    'social_metrics','songs','tours','run_of_show','gear_checklists','autonomy_configs',
    'saved_filters','messages','band_schedules','agent_schedule_state','band_email_accounts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.%I;', t);
  END LOOP;
END $$;

-- 2. Tablas de supabase_migration_only_new.sql que nunca llegaron a tener
--    ENABLE ROW LEVEL SECURITY ni política en el fichero — si nadie la
--    activó a mano en Studio, hoy están abiertas sin ni siquiera pasar por
--    RLS. Se activa aquí también, por si acaso, sin política nueva.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'social_content_items','stripe_webhook_events','deleted_leads','deleted_bands'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.%I;', t);
  END LOOP;
END $$;

COMMIT;

-- Verificación tras aplicar: esta consulta debe devolver 0 filas (ninguna
-- política que conceda acceso a anon/authenticated en las tablas de arriba).
--
-- SELECT schemaname, tablename, policyname, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'registered_bands','users','user_bands','leads','lead_messages','band_contacts',
--     'setlists','rehearsals','concerts','epk_configs','fans','social_posts','payments',
--     'social_metrics','songs','tours','run_of_show','gear_checklists','autonomy_configs',
--     'saved_filters','messages','band_schedules','agent_schedule_state','band_email_accounts',
--     'social_content_items','stripe_webhook_events','deleted_leads','deleted_bands'
--   );
