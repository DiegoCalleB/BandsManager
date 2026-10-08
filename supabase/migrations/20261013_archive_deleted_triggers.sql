-- Funciones y triggers que archivan en la lista negra (deleted_leads / deleted_bands) al borrar.
-- Existían en producción sin migración versionada; 20261013_security_hardening_functions.sql las
-- altera y fallaba en una base nueva. Definiciones copiadas de pg_get_functiondef en producción
-- (search_path ya fijado, como lo deja el endurecimiento posterior). Idempotente.
CREATE OR REPLACE FUNCTION public.trg_fn_archive_deleted_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO deleted_leads (id, band_id, nombre_sala, ciudad, motivo, created_at)
  VALUES (
    'del-lead-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
    OLD.band_id,
    OLD.nombre_sala,
    COALESCE(OLD.ciudad, ''),
    'Eliminado por el usuario (Trigger automático)',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_fn_archive_deleted_band()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO deleted_bands (id, band_id, nombre_banda, motivo, created_at)
  VALUES (
    'del-band-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
    OLD.band_id,
    OLD.nombre_banda,
    'Eliminado por el usuario (Trigger automático)',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_archive_deleted_lead ON public.leads;
CREATE TRIGGER trg_archive_deleted_lead BEFORE DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_archive_deleted_lead();

DROP TRIGGER IF EXISTS trg_archive_deleted_band ON public.band_contacts;
CREATE TRIGGER trg_archive_deleted_band BEFORE DELETE ON public.band_contacts
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_archive_deleted_band();
