-- ====================================================================
-- MIGRACIÓN SUPABASE: negotiation_start_cache_by_type EN autonomy_configs (BandManager.ai)
-- ====================================================================
-- Caché de inicio de negociación por tipo de recinto, separado del caché mínimo real
-- (min_cache_by_type). Si la sala pregunta directamente por el caché, el Redactor responde
-- con esta cifra en vez del mínimo real, dejando margen para negociar a la baja sin bajar
-- nunca del mínimo. Ver server/db/autonomy.ts y server/utils/bandDna.ts.

ALTER TABLE autonomy_configs ADD COLUMN IF NOT EXISTS negotiation_start_cache_by_type JSONB;
