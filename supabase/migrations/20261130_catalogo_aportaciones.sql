-- Migration: 20261130_catalogo_aportaciones.sql
-- Aportaciones del público al directorio («sé la ciudad de este festival», «ha cambiado la web», «ya no existe»…).
-- Nunca se publican solas: entran como «pendiente» y alguien las revisa contra la fuente antes de tocar la ficha.
-- Lleva el email de contacto opcional de quien aporta, así que la tabla NO tiene política para anon ni authenticated:
-- con RLS activa y sin políticas solo la escribe y la lee el backend (clave de servicio). Idempotente.

CREATE TABLE IF NOT EXISTS public.catalogo_aportaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('festival', 'sala')),
  ficha_id TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor TEXT NOT NULL CHECK (char_length(valor) BETWEEN 1 AND 300),
  fuente TEXT CHECK (fuente IS NULL OR char_length(fuente) <= 500),
  comentario TEXT CHECK (comentario IS NULL OR char_length(comentario) <= 1000),
  contacto TEXT CHECK (contacto IS NULL OR char_length(contacto) <= 200),
  idioma TEXT NOT NULL DEFAULT 'es',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aplicada', 'descartada')),
  revisada_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_aportaciones_pendientes ON public.catalogo_aportaciones (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalogo_aportaciones_ficha ON public.catalogo_aportaciones (tipo, ficha_id);

ALTER TABLE public.catalogo_aportaciones ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.catalogo_aportaciones IS 'Aportaciones públicas al directorio de festivales y salas, pendientes de revisión. Solo backend.';
