-- Métricas públicas de cada banda: una fila por banda, fuente y mes (historial mensual).
-- Fuentes: Spotify (seguidores, popularidad), Deezer (fans), YouTube (suscriptores, visualizaciones).
-- Idempotente. Rollback: DROP TABLE band_metricas.
CREATE TABLE IF NOT EXISTS band_metricas (
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

CREATE INDEX IF NOT EXISTS band_metricas_band_idx ON band_metricas (band_id, periodo);

-- RLS activado sin políticas: los clientes no leen ni escriben; el backend usa la service role.
ALTER TABLE band_metricas ENABLE ROW LEVEL SECURITY;
