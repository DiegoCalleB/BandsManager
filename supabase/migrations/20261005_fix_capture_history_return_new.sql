-- ====================================================================
-- FIX CRÍTICO: fn_capture_row_history() devolvía OLD también en UPDATE.
--
-- El trigger trg_capture_history es BEFORE DELETE OR UPDATE. En un trigger BEFORE, el valor
-- devuelto es la fila que se escribe: devolver OLD en un UPDATE hace que el UPDATE no cambie
-- NADA (y sin error). Desde 2026-09-22 todo UPDATE sobre las tablas cubiertas se descartaba en
-- silencio: epk_configs, songs, setlists, concerts, rehearsals, tours, band_contacts,
-- gear_checklists y run_of_show. La API respondía 200 y el historial registraba el "cambio",
-- pero la fila real quedaba intacta. Solo funcionaban los INSERT y los DELETE.
--
-- Idempotente: CREATE OR REPLACE. No toca datos ni triggers.
-- ====================================================================
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
  v_fila_id := COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'band_id');
  v_band_id := to_jsonb(OLD)->>'band_id';

  INSERT INTO public.data_change_history(tabla, fila_id, band_id, operacion, datos_anteriores)
  VALUES (TG_TABLE_NAME, v_fila_id, v_band_id, TG_OP, to_jsonb(OLD));

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
