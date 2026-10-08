-- Migration: 20261014_letras_automaticas.sql
-- Cola de transcripción de letras en el servidor (sobrevive a recargar o cerrar la pestaña) y
-- ajuste opt-in por banda «Transcribir automáticamente lo nuevo» (apagado por defecto).

CREATE TABLE IF NOT EXISTS public.band_letras_auto (
  band_id TEXT PRIMARY KEY,
  activado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.letras_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  song_id TEXT NOT NULL,
  -- pendiente | en_curso | hecha | sin_letra | omitida | fallida
  estado TEXT NOT NULL DEFAULT 'pendiente',
  intentos INTEGER NOT NULL DEFAULT 0,
  origen TEXT NOT NULL DEFAULT 'manual', -- manual | auto
  error TEXT,
  disponible_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT letras_jobs_band_song_unique UNIQUE (band_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_letras_jobs_cola ON public.letras_jobs(estado, disponible_desde);
CREATE INDEX IF NOT EXISTS idx_letras_jobs_band ON public.letras_jobs(band_id, estado);

ALTER TABLE public.band_letras_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letras_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_letras_auto;
CREATE POLICY "Permitir acceso total al backend" ON public.band_letras_auto FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.letras_jobs;
CREATE POLICY "Permitir acceso total al backend" ON public.letras_jobs FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.letras_jobs IS 'Cola de transcripción de letras (Whisper) por canción; un trabajo por (banda, canción).';
COMMENT ON TABLE public.band_letras_auto IS 'Opt-in por banda: transcribir solo las canciones nuevas con audio y sin cifrado.';
