-- Endurecimiento tras auditoría de advisors (2026-10-08).
-- fn_capture_row_history es una función de trigger SECURITY DEFINER: no debe ser invocable por RPC.
REVOKE EXECUTE ON FUNCTION public.fn_capture_row_history() FROM PUBLIC, anon, authenticated;

-- search_path fijo en las funciones que lo tenían mutable (public incluye pgvector/pg_trgm).
ALTER FUNCTION public.trg_fn_archive_deleted_lead() SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_fn_archive_deleted_band() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_audit_log_mutation() SET search_path = public, pg_temp;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT oid::regprocedure AS sig FROM pg_proc
           WHERE pronamespace = 'public'::regnamespace AND proname = 'match_pitch_embeddings'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;

-- Defensa en profundidad: band_print_settings solo se accede vía servidor (service role).
REVOKE ALL ON TABLE public.band_print_settings FROM anon;
