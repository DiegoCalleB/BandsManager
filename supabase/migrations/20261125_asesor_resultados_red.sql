-- Migration: 20261125_asesor_resultados_red.sql
-- Cómo le fue a cada pieza del Asesor de Marketing en TikTok y YouTube Shorts. Instagram sigue en
-- `asesor_resultados` (alcance, guardados, no seguidores, con los umbrales del temario); aquí cada red
-- mide lo suyo, así que las métricas van en un JSONB cuyos campos valida el servidor
-- (src/utils/asesor/metricasPorRed.ts). El formato y el título los pone el servidor a partir de la
-- acción «hecho», nunca el cliente. Una fila por banda, día, idea y red. Idempotente.

CREATE TABLE IF NOT EXISTS public.asesor_resultados_red (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  tarjeta_id TEXT NOT NULL,
  -- Sin CHECK de valores, como el resto del esquema: la lista blanca vive en el servidor.
  red TEXT NOT NULL,
  formato TEXT NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  metricas JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (band_id, fecha, tarjeta_id, red)
);

CREATE INDEX IF NOT EXISTS idx_asesor_resultados_red_band_fecha ON public.asesor_resultados_red(band_id, fecha DESC);

-- RLS: mismo patrón que el resto de tablas, acceso total al backend. El aislamiento por banda lo
-- hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.asesor_resultados_red ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.asesor_resultados_red;
CREATE POLICY "Permitir acceso total al backend" ON public.asesor_resultados_red
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.asesor_resultados_red IS 'Resultados de las piezas del Asesor de Marketing en TikTok y YouTube Shorts, por banda, día, idea y red.';
