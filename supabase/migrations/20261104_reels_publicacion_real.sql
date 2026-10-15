-- Publicación real de Reels (sustituye a la simulación de socialPublisher).
-- Idempotente: se puede lanzar varias veces.

-- Cuándo se reclamó el post para publicarlo. Si el proceso muere a mitad, el worker usa esta
-- marca para sacarlo de 'publicando' en vez de dejarlo colgado para siempre.
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS publish_started_at TIMESTAMPTZ;

-- Procedencia de cada clip renderizado: de qué vídeo sale y si sus derechos son de la banda.
-- El publicador solo autopublica clips con derechos acreditados (strike de copyright = riesgo
-- real para la banda). Es también la base para cruzar rendimiento por clip más adelante.
CREATE TABLE IF NOT EXISTS reel_clips (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    clip_url TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    source_author TEXT NOT NULL DEFAULT '',
    source_author_url TEXT NOT NULL DEFAULT '',
    -- 'canal_de_la_banda' cuando el canal de origen coincide con el YouTube de la banda; NULL si no.
    derechos TEXT,
    loop_perfecto BOOLEAN NOT NULL DEFAULT FALSE,
    hook_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reel_clips_band_url ON reel_clips(band_id, clip_url);

-- Solo el servidor (service_role) la usa; sin políticas, nadie más la lee ni la escribe.
ALTER TABLE reel_clips ENABLE ROW LEVEL SECURITY;
