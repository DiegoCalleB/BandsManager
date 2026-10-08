-- Migration: 20261018_concerts_index_band_fecha.sql
-- Índice (band_id, fecha) de `concerts`: existe en producción pero ningún SQL del repo lo
-- declaraba, así que una base nueva no lo tenía. Idempotente.

CREATE INDEX IF NOT EXISTS idx_concerts_band_fecha ON public.concerts USING btree (band_id, fecha);
