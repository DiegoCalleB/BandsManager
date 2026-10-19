-- RLS en el registro interno del ejecutor de migraciones.
-- `schema_migrations` vive en `public`, así que PostgREST la exponía a anon/authenticated con todos los privilegios.
-- Sin políticas, RLS deniega todo a esos roles. No afecta al runner (conecta como `postgres`, propietario con BYPASSRLS)
-- ni a `service_role` (BYPASSRLS). Idempotente; IF EXISTS porque la tabla la crea el runner, no el esquema (los tests cargan las migraciones sin runner).
ALTER TABLE IF EXISTS public.schema_migrations ENABLE ROW LEVEL SECURITY;
