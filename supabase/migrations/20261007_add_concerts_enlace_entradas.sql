-- ====================================================================
-- MIGRATION: Enlace de venta de entradas por concierto (EPK + landing de fans)
-- ====================================================================

ALTER TABLE concerts
  ADD COLUMN IF NOT EXISTS enlace_entradas TEXT;
