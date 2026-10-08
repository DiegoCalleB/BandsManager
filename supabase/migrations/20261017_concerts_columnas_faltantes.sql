-- Migration: 20261017_concerts_columnas_faltantes.sql
-- `dbUpsertConcert` (server/db/concerts.ts) escribe columnas de `concerts` que ningún SQL del repo
-- declaraba y que no existían en producción: `escrituraTolerante` las quitaba al guardar (solo
-- avisaba con X-Guardado-Parcial) y `esConciertoPublicable` leía un `is_posible` inexistente, así
-- que un bolo sin confirmar nunca se marcaba como tal. Idempotente.
-- `entradas_url` y `entradas_lugar_fisico` ya existen en producción pero tampoco estaban
-- declaradas: se incluyen para que una base nueva quede igual.

ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS is_posible BOOLEAN DEFAULT FALSE;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS custom_qr_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS cartel_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS es_hito_destacado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS asistencia_propia INTEGER DEFAULT 0;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS asistencia_otras_bandas INTEGER DEFAULT 0;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS bandas_compartidas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS post_show_review TEXT DEFAULT '';
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS entradas_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS entradas_lugar_fisico TEXT;
