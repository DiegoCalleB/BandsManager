-- Métricas públicas de bandas AMIGAS (no la propia banda: esa vive en social_metrics).
-- Una fila por banda, fuente y mes (historial mensual).
-- Fuentes: Spotify (seguidores, popularidad), Deezer (fans), YouTube (suscriptores, visualizaciones).
-- Idempotente. Rollback: DROP TABLE metricas_bandas_amigas.
CREATE TABLE IF NOT EXISTS metricas_bandas_amigas (
  id BIGSERIAL PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  band_contact_id TEXT NOT NULL REFERENCES band_contacts(id) ON DELETE CASCADE,
  fuente TEXT NOT NULL CHECK (fuente IN ('spotify', 'deezer', 'youtube')),
  periodo TEXT NOT NULL CHECK (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  seguidores BIGINT,
  fans BIGINT,
  suscriptores BIGINT,
  visualizaciones BIGINT,
  popularidad INTEGER,
  capturado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (band_contact_id, fuente, periodo)
);

CREATE INDEX IF NOT EXISTS metricas_bandas_amigas_band_idx ON metricas_bandas_amigas (band_id, periodo);

-- RLS activado sin políticas: los clientes no leen ni escriben; el backend usa la service role.
ALTER TABLE metricas_bandas_amigas ENABLE ROW LEVEL SECURITY;
