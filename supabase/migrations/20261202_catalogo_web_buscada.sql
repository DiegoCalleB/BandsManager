-- Migration: 20261202_catalogo_web_buscada.sql
-- Cuándo buscó el agente del catálogo la web oficial de una ficha que no la tenía (server/services/buscarWebsDeSalas.ts).
-- Sirve para no repetir cada noche la búsqueda de las que no tienen web segura. Idempotente.

ALTER TABLE public.catalogo_salas ADD COLUMN IF NOT EXISTS web_buscada_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_sin_web ON public.catalogo_salas (web_buscada_en NULLS FIRST) WHERE website IS NULL;
