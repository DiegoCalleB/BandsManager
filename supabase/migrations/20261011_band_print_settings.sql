-- Migration: 20261011_band_print_settings.sql
-- Ajustes de impresión del setlist por banda (alineación, columnas, notas generales, badges,
-- logo, marca de agua, tinta). Una fila por banda; `settings` es JSONB validado por lista blanca
-- en el servidor (src/utils/printSettings.ts), nunca se guarda lo que mande el cliente tal cual.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.band_print_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_print_settings_band_id ON public.band_print_settings(band_id);

-- RLS (Row Level Security): mismo patrón que el resto de tablas, acceso total al backend. El
-- aislamiento por banda lo hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.band_print_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_print_settings;
CREATE POLICY "Permitir acceso total al backend" ON public.band_print_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.band_print_settings IS 'Ajustes de impresión del setlist recordados por banda (lista blanca en src/utils/printSettings.ts).';
