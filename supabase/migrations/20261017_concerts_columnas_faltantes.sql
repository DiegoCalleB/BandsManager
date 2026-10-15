-- Migration: 20261017_concerts_columnas_faltantes.sql
-- Columnas de `concerts` que el código ya lee y escribe (server/db/concerts.ts) pero que ningún
-- SQL del repo declaraba. En producción faltaban las 8 primeras: las escrituras las descartaba
-- `escrituraTolerante` (cabecera X-Guardado-Parcial) y esos datos no se guardaban nunca.
-- Las 5 últimas ya existen en producción; se declaran para que el repo sea la fuente de verdad.
-- Idempotente.

ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS is_posible BOOLEAN DEFAULT FALSE;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS custom_qr_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS cartel_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS es_hito_destacado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS asistencia_propia INTEGER DEFAULT 0;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS asistencia_otras_bandas INTEGER DEFAULT 0;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS bandas_compartidas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS post_show_review TEXT DEFAULT '';

ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS gira_id TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS gira_nombre TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS entradas_url TEXT;
ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS entradas_lugar_fisico TEXT;
