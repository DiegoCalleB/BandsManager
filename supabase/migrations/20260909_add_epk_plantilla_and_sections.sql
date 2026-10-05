-- Migración: Añadir campos de plantilla y orden de secciones a epk_configs
ALTER TABLE epk_configs 
ADD COLUMN IF NOT EXISTS plantilla TEXT DEFAULT 'stage',
ADD COLUMN IF NOT EXISTS orden_secciones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS secciones_ocultas JSONB DEFAULT '[]'::jsonb;
