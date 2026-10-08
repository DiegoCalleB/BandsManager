-- Migration: 20261015_enlaces_cortos.sql
-- Enlaces cortos con atribución (bandmanager.io/r/<código>). Cada enlace pertenece a una banda y
-- apunta a un DESTINO LÓGICO (entradas, página del concierto, EPK, landing de fans), no a una URL
-- libre: la URL real se resuelve al pulsar, a partir de los datos de la banda. Así el dominio de la
-- marca no sirve para redirigir a un sitio arbitrario (AGENTS.md §1, seguimiento público) y, si la
-- banda cambia su enlace de entradas, los enlaces ya repartidos siguen funcionando.
-- Los clics no guardan IP ni nada que identifique a la persona: `visitante` es un hash que rota
-- cada día. Idempotente.

CREATE TABLE IF NOT EXISTS public.short_links (
  code TEXT PRIMARY KEY,
  band_id TEXT NOT NULL,
  concert_id TEXT,
  -- 'entradas' | 'concierto' | 'epk' | 'fans'. Se valida en la app (server/utils/enlacesCortos.ts, esDestino).
  destino TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'otro',
  -- Huella de (concierto, destino, canal): un único enlace por combinación y banda.
  clave TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_band_clave ON public.short_links(band_id, clave);
CREATE INDEX IF NOT EXISTS idx_short_links_band_concert ON public.short_links(band_id, concert_id);

CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL REFERENCES public.short_links(code) ON DELETE CASCADE,
  band_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  visitante TEXT,
  dispositivo TEXT,
  origen TEXT
);

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_band_fecha ON public.short_link_clicks(band_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_code ON public.short_link_clicks(code);

-- RLS: mismo patrón que el resto de tablas (acceso total al backend). El aislamiento por banda
-- lo hace la capa de aplicación (getTargetBandId), ver AGENTS.md §2.1.
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.short_links;
CREATE POLICY "Permitir acceso total al backend" ON public.short_links
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.short_link_clicks;
CREATE POLICY "Permitir acceso total al backend" ON public.short_link_clicks
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.short_links IS 'Enlaces cortos de una banda (/r/<code>) con destino lógico resuelto al pulsar.';
COMMENT ON TABLE public.short_link_clicks IS 'Clics en enlaces cortos. Sin IP: visitante es un hash que rota a diario.';
