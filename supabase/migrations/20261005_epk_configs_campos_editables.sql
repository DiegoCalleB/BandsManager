-- Migración idempotente: columnas de epk_configs que el editor del EPK permite cambiar y que
-- antes no existían en la tabla (el servidor las descartaba al guardar).
-- Las 3 primeras ya estaban en 20260909_add_epk_plantilla_and_sections.sql pero NO se aplicaron
-- en producción (cada guardado fallaba 3 veces con "Could not find the column").
ALTER TABLE public.epk_configs
  ADD COLUMN IF NOT EXISTS plantilla TEXT DEFAULT 'stage',
  ADD COLUMN IF NOT EXISTS orden_secciones JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS secciones_ocultas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS genero TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS frase_impacto TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bandas_similares JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mostrar_bandas_similares BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rider_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS idioma TEXT,
  ADD COLUMN IF NOT EXISTS font_style TEXT,
  ADD COLUMN IF NOT EXISTS tipografia TEXT;
