-- Migration: 20261123_asesor_acciones.sql
-- Lo que la banda hace con las ideas del Asesor de Marketing: «hecho» o «saltado», una fila por
-- banda, día e idea. Es la señal con la que el asesor aprende qué formatos usa cada banda y cuáles
-- evita (src/utils/asesor/opciones.ts). El formato lo pone el servidor, nunca el cliente.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.asesor_acciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  tarjeta_id TEXT NOT NULL,
  -- Sin CHECK de valores, como el resto del esquema: la lista blanca vive en el servidor
  -- (server/routes/asesor.ts y server/db/asesorMarketing.ts, que además descarta lo raro al leer).
  formato TEXT NOT NULL,
  accion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (band_id, fecha, tarjeta_id)
);

CREATE INDEX IF NOT EXISTS idx_asesor_acciones_band_fecha ON public.asesor_acciones(band_id, fecha DESC);

-- RLS: mismo patrón que el resto de tablas, acceso total al backend. El aislamiento por banda lo
-- hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.asesor_acciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.asesor_acciones;
CREATE POLICY "Permitir acceso total al backend" ON public.asesor_acciones
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.asesor_acciones IS 'Hecho/saltado de cada idea del Asesor de Marketing, por banda y día.';
