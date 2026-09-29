-- ====================================================================
-- MIGRATION: 20260922_data_change_history.sql
-- Histórico genérico de cambios para tablas de contenido de banda.
--
-- Motivación: un bug real en dbUpsertEpkConfig sobrescribía el array
-- `miembros` entero en vez de fusionarlo por id, y un guardado desde el
-- onboarding (que nunca gestionó foto/bio) borró en silencio esos campos
-- de los 4 integrantes de una banda real — sin ningún error, sin que
-- nadie lo notara hasta que alguien miró la pantalla vacía.
--
-- Ese bug concreto ya está arreglado en el código, pero el problema de
-- fondo es más amplio: cualquier UPDATE futuro (otro bug de merge, un
-- error humano, una migración mal escrita, un endpoint sin terminar de
-- probar) puede volver a sobrescribir contenido sin dejar rastro. El
-- proyecto YA tenía un patrón para esto en DELETE (deleted_leads,
-- deleted_bands, vía trigger) — esta migración extiende el MISMO
-- espíritu a UPDATE, y lo generaliza a una sola tabla de histórico en
-- vez de una tabla "deleted_X" por cada tabla cubierta.
--
-- Esto no sustituye arreglar cada bug de merge que se encuentre — es la
-- red de seguridad para cuando (no si) aparezca el próximo que no
-- previmos.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.data_change_history (
    id BIGSERIAL PRIMARY KEY,
    tabla TEXT NOT NULL,
    fila_id TEXT NOT NULL,
    band_id TEXT,
    operacion TEXT NOT NULL, -- 'UPDATE' | 'DELETE'
    datos_anteriores JSONB NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_change_history_tabla_fila
    ON public.data_change_history(tabla, fila_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_change_history_band
    ON public.data_change_history(band_id, changed_at DESC);

-- Recuperar el estado de una fila en un momento dado (o el más reciente
-- guardado) es tan simple como:
--   SELECT datos_anteriores FROM data_change_history
--   WHERE tabla = 'epk_configs' AND fila_id = 'band-bakandeya'
--   ORDER BY changed_at DESC LIMIT 1;

CREATE OR REPLACE FUNCTION public.fn_capture_row_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fila_id TEXT;
  v_band_id TEXT;
BEGIN
  -- No todas las tablas cubiertas tienen una columna `id` propia
  -- (epk_configs se identifica por band_id) — se usa la que exista.
  v_fila_id := COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'band_id');
  v_band_id := to_jsonb(OLD)->>'band_id';

  INSERT INTO public.data_change_history(tabla, fila_id, band_id, operacion, datos_anteriores)
  VALUES (TG_TABLE_NAME, v_fila_id, v_band_id, TG_OP, to_jsonb(OLD));

  RETURN OLD;
END;
$$;

-- Tablas de contenido de banda cubiertas en esta primera pasada: lo que
-- costaría de verdad reconstruir a mano si se pierde (EPK, repertorio,
-- agenda, contactos de booking). Deliberadamente fuera: logs de
-- ejecución de agentes, tokens OAuth, colas de procesamiento y caché de
-- stems — no son contenido de la banda, son datos técnicos/efímeros que
-- no vale la pena versionar.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'epk_configs',
    'songs',
    'setlists',
    'concerts',
    'tours',
    'band_contacts',
    'rehearsals',
    'run_of_show',
    'gear_checklists',
    'registered_bands'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_capture_history ON public.%I;
       CREATE TRIGGER trg_capture_history
       BEFORE UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();',
      t, t
    );
  END LOOP;
END $$;
