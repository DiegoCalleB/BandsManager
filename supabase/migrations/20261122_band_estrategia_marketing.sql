-- Migration: 20261122_band_estrategia_marketing.sql
-- Estrategia de marketing de la banda para el Asesor de Marketing: objetivo, etapa, público, horas
-- a la semana, quién sale a cámara, temas propios, líneas rojas, referentes y próximo lanzamiento.
-- Una fila por banda; `estrategia` es JSONB validado por lista blanca en el servidor
-- (sanearEstrategia en src/utils/asesor/estrategia.ts): nunca se guarda lo que mande el cliente tal cual.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.band_estrategia_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL UNIQUE,
  estrategia JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_estrategia_marketing_band_id ON public.band_estrategia_marketing(band_id);

-- RLS: mismo patrón que el resto de tablas, acceso total al backend. El aislamiento por banda lo
-- hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.band_estrategia_marketing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_estrategia_marketing;
CREATE POLICY "Permitir acceso total al backend" ON public.band_estrategia_marketing
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.band_estrategia_marketing IS 'Estrategia de marketing de la banda para el Asesor (lista blanca en src/utils/asesor/estrategia.ts).';
