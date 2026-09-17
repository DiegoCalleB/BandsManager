-- ====================================================================
-- MIGRATION: Add Ensayos Pro & Modo Local en Vivo fields to rehearsals
-- ====================================================================

ALTER TABLE rehearsals
  ADD COLUMN IF NOT EXISTS hora_fin TEXT,
  ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS objetivos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duracion_estimada_min INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duracion_real_seg INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cronometro_estado JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS acta JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS grabaciones JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rating_general INTEGER,
  ADD COLUMN IF NOT EXISTS temperatura_local TEXT;

COMMENT ON COLUMN rehearsals.agenda IS 'Orden del día con minutaje, canciones vinculadas, enfoque y evaluaciones';
COMMENT ON COLUMN rehearsals.acta IS 'Acta digital con resumen ejecutivo, deberes de casa por músico y tomas destacadas';
COMMENT ON COLUMN rehearsals.grabaciones IS 'Tomas de audio y notas de voz grabadas durante el ensayo';
