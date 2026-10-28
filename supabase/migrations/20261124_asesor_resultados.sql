-- Migration: 20261124_asesor_resultados.sql
-- Cómo le fue a cada pieza que la banda publicó siguiendo al Asesor de Marketing: el alcance, los
-- guardados y, si se quiere, cuánta gente que no los seguía. Se anotan a mano a las 48 h (lo que
-- enseña Instagram en «Estadísticas») y de ahí el asesor aprende qué formatos funcionan para ESA
-- banda (src/utils/asesor/resumen.ts y opciones.ts). El formato y el título los pone el servidor
-- a partir de la acción «hecho», nunca el cliente. Idempotente.

-- El título de la idea, para poder pedir sus números días después sin reconstruirla.
ALTER TABLE public.asesor_acciones ADD COLUMN IF NOT EXISTS titulo TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.asesor_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  tarjeta_id TEXT NOT NULL,
  formato TEXT NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  alcance INTEGER NOT NULL,
  guardados INTEGER NOT NULL,
  alcance_no_seguidores INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (band_id, fecha, tarjeta_id)
);

CREATE INDEX IF NOT EXISTS idx_asesor_resultados_band_fecha ON public.asesor_resultados(band_id, fecha DESC);

-- RLS: mismo patrón que el resto de tablas, acceso total al backend. El aislamiento por banda lo
-- hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.asesor_resultados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.asesor_resultados;
CREATE POLICY "Permitir acceso total al backend" ON public.asesor_resultados
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.asesor_resultados IS 'Resultados (alcance y guardados) de las piezas publicadas con el Asesor de Marketing, por banda y día.';
