-- Métricas reales de cada Reel publicado (Fase 5 del plan de Reels).
-- Una fila por (post, medición): 1 h, 24 h, 72 h o 7 días tras publicar. Las métricas son NULL
-- cuando Meta no las devuelve: NULL = "no lo sabemos", nunca 0 = "nadie lo vio".
-- La duración y el loop del clip se copian en el momento de medir para que el aprendizaje lea una
-- sola tabla. Idempotente: se puede lanzar varias veces.

ALTER TABLE reel_clips
  ADD COLUMN IF NOT EXISTS duracion_seg NUMERIC;

CREATE TABLE IF NOT EXISTS reel_metricas (
    post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    horas SMALLINT NOT NULL CHECK (horas IN (1, 24, 72, 168)),
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    published_id TEXT NOT NULL,
    duracion_seg NUMERIC,
    loop_perfecto BOOLEAN,
    views INTEGER,
    reach INTEGER,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    saves INTEGER,
    avg_watch_ms INTEGER,
    total_watch_ms BIGINT,
    medido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, horas)
);

-- El aprendizaje lee las métricas de una banda; el worker, las de unos posts concretos (PK).
CREATE INDEX IF NOT EXISTS idx_reel_metricas_band ON reel_metricas(band_id, medido_en DESC);

-- Solo el servidor (service_role) la usa; sin políticas, nadie más la lee ni la escribe.
ALTER TABLE reel_metricas ENABLE ROW LEVEL SECURITY;
