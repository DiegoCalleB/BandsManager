-- =========================================================================
-- RESTRINGIR RLS A LA SERVICE_ROLE KEY — APLICADA EN PRODUCCIÓN (2026-08-23)
-- =========================================================================
-- Contexto: todas las tablas tenían RLS activada, pero la política
-- "Permitir acceso total al backend" (y sus variantes con nombre propio,
-- ver más abajo) usaba `USING (true)` sin restringir el rol destinatario —
-- en Postgres eso equivale a TO public, es decir, se aplicaba también a
-- `anon` y `authenticated`, no solo al backend. Como el backend en Railway
-- había estado usando SUPABASE_ANON_KEY (ver server/db/core.ts), cualquiera
-- con esa key tenía lectura/escritura total sobre TODAS las tablas —
-- incluida `users` (hashes de contraseña) y `oauth_tokens` (credenciales de
-- email conectado por banda).
--
-- El backend de este repo (server/) es el ÚNICO cliente que habla con
-- Supabase — el frontend (src/) no importa @supabase/supabase-js en ningún
-- sitio, todo pasa por la API Node. Por eso es seguro quitarle el acceso a
-- `anon`/`authenticated` por completo: basta con NO dejar ninguna política
-- para esos roles. El rol `service_role` de Postgres tiene BYPASSRLS
-- activado por defecto en Supabase, así que sigue teniendo acceso total sin
-- necesidad de una política propia — es exactamente para eso para lo que
-- existe SUPABASE_SERVICE_ROLE_KEY.
--
-- Antes de aplicar esto se confirmó en Railway (proyecto BandManager,
-- servicio BandManagement-AI) que SUPABASE_SERVICE_ROLE_KEY ya estaba
-- desplegada y el backend funcionando con normalidad (logs del último
-- deploy: arranque limpio + SocialRadar leyendo/escribiendo datos de las
-- 15 bandas registradas sin errores).
--
-- Los nombres de política de abajo son los reales de producción — se
-- comprobaron con `SELECT * FROM pg_policies WHERE schemaname='public'`
-- antes de escribir este fichero, y NO coinciden 1:1 con
-- supabase_schema.sql / supabase_migration_only_new.sql: hay tablas vivas
-- que no están en esos ficheros (oauth_tokens, agent_execution_logs,
-- sticker_orders, stripe_invoices, stripe_subscriptions — creadas a mano en
-- Studio o por una migración no commiteada) y tablas de esos ficheros que
-- no existen en la base viva (agent_schedule_state, band_email_accounts,
-- deleted_leads, deleted_bands, stripe_webhook_events — su CREATE TABLE
-- nunca se llegó a ejecutar en producción). `social_content_items` ya
-- tenía RLS activada sin ninguna política (ya denegaba a anon/authenticated
-- de antes), así que no necesitó ningún DROP.
--
-- No toca las políticas del bucket de Storage `band-media` (definidas en
-- supabase_migration_only_new.sql) — esas se dejaron abiertas a propósito
-- para servir media pública del EPK, y tampoco las usa el frontend
-- directamente, pero es un cambio de alcance distinto y no forma parte de
-- este arreglo.
-- =========================================================================

DROP POLICY IF EXISTS "Permitir acceso total a agent_execution_logs" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.autonomy_configs;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_contacts;
DROP POLICY IF EXISTS "Permitir lectura general de horarios" ON public.band_schedules;
DROP POLICY IF EXISTS "Permitir escritura general de horarios" ON public.band_schedules;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.concerts;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.epk_configs;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.fans;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.gear_checklists;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.lead_messages;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.leads;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.messages;
DROP POLICY IF EXISTS "Permitir lectura general de tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Permitir escritura general de tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.payments;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.registered_bands;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.rehearsals;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.run_of_show;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.saved_filters;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.setlists;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.social_metrics;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.social_posts;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.songs;
DROP POLICY IF EXISTS "Permitir acceso a pedidos de pegatinas" ON public.sticker_orders;
DROP POLICY IF EXISTS "Permitir acceso a facturas" ON public.stripe_invoices;
DROP POLICY IF EXISTS "Permitir acceso a suscripciones" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.tours;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.user_bands;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.users;

-- Verificación tras aplicar (comprobado en producción: 0 filas):
--
-- SELECT tablename, policyname, roles FROM pg_policies WHERE schemaname = 'public';
--
-- El advisor de seguridad de Supabase pasa a listar "RLS Enabled No Policy"
-- (nivel INFO, no WARN/ERROR) en las 28 tablas — es el estado correcto:
-- RLS activa y sin política = acceso denegado por defecto a anon/authenticated,
-- service_role sigue con BYPASSRLS.
