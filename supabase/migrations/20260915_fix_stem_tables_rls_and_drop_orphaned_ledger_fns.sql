-- stem_prediction_jobs y stem_storage_retry_queue se crearon (20260913_add_stems_cache_and_
-- prediction_jobs.sql y una migración posterior) sin activar RLS: el linter de seguridad de
-- Supabase las marcaba como "Unrestricted" - expuestas sin restricción vía la API REST pública
-- (PostgREST), pese a tener band_id, audio_url, rutas de storage y mensajes de error internos.
-- Se activa RLS sin políticas, igual que el resto de tablas de este esquema: el backend accede
-- siempre con la service_role key (que salta RLS), así que esto simplemente cierra el acceso
-- directo vía la API pública para los roles anon/authenticated, sin tocar cómo funciona la app.
ALTER TABLE public.stem_prediction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_storage_retry_queue ENABLE ROW LEVEL SECURITY;

-- get_ai_debt_cents(p_user_id text) y settle_ai_donation(p_user_id text, ...) eran las firmas
-- originales del ledger de IA antes de pasar a ser por banda (20260915_ai_token_ledger_band_
-- scope.sql introdujo las versiones con p_band_id). Las viejas nunca se borraron: quedaban
-- huérfanas, SECURITY DEFINER, y llamables directamente por anon/authenticated vía
-- /rest/v1/rpc/... sin pasar por ningún control de acceso de la app. Nada en el código las usa
-- ya (server/db/aiLedger.ts solo llama a las versiones con p_band_id).
DROP FUNCTION IF EXISTS public.get_ai_debt_cents(p_user_id text);
DROP FUNCTION IF EXISTS public.settle_ai_donation(p_user_id text, p_amount_paid_cents integer, p_stripe_event_id text);
