-- Migration: 20261105_band_cartel_estilo.sql
-- ADN visual de la banda para sus carteles: paleta sacada del logo, estilo preferido, hasta 3
-- imágenes de referencia que la IA mira y los fondos que la banda acabó compartiendo (favoritos).
-- Una fila por banda; `estilo` es JSONB validado por lista blanca en el servidor
-- (sanearAdn en src/utils/cartel/adn.ts): nunca se guarda lo que mande el cliente tal cual, y las
-- URLs solo valen si son de la carpeta carteles/{bandId}/ de nuestro almacenamiento.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.band_cartel_estilo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL UNIQUE,
  estilo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_cartel_estilo_band_id ON public.band_cartel_estilo(band_id);

-- RLS: mismo patrón que el resto de tablas, acceso total al backend. El aislamiento por banda lo
-- hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.band_cartel_estilo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_cartel_estilo;
CREATE POLICY "Permitir acceso total al backend" ON public.band_cartel_estilo
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.band_cartel_estilo IS 'ADN visual de la banda para sus carteles (lista blanca en src/utils/cartel/adn.ts).';
