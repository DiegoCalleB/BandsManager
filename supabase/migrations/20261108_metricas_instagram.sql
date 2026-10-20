-- Instagram como fuente de métricas de bandas amigas (seguidores vía business_discovery).
-- La restricción de `fuente` solo admitía spotify, deezer y youtube.
ALTER TABLE metricas_bandas_amigas DROP CONSTRAINT IF EXISTS metricas_bandas_amigas_fuente_check;
ALTER TABLE metricas_bandas_amigas
  ADD CONSTRAINT metricas_bandas_amigas_fuente_check
  CHECK (fuente IN ('spotify', 'deezer', 'youtube', 'instagram'));
