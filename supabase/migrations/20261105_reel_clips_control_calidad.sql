-- Informe del control de calidad de cada clip (Fase 6 del plan de Reels).
-- { aprobado: bool, bloqueantes: [{codigo, mensaje}], avisos: [...] }. NULL = no se pudo medir,
-- y el publicador lo trata como no apto para autopublicar (nunca como aprobado).
-- Idempotente: se puede lanzar varias veces.
ALTER TABLE reel_clips
  ADD COLUMN IF NOT EXISTS control_calidad JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reel_clips_control_calidad_objeto'
      AND conrelid = 'public.reel_clips'::regclass
  ) THEN
    ALTER TABLE reel_clips
      ADD CONSTRAINT reel_clips_control_calidad_objeto
      CHECK (control_calidad IS NULL OR jsonb_typeof(control_calidad) = 'object');
  END IF;
END $$;
