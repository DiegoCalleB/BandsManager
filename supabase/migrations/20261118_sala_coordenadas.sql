-- Coordenadas del catálogo de salas para verlas en el mapa. `lat` y `lon` ya existen (20261113); aquí se añade si el punto es
-- el de la sala o solo el de su ciudad (`coordenadas_aprox`) y cuándo se intentó geolocalizar (para no repetir cada día las
-- que ninguna fuente supo situar). Las coordenadas vienen de OpenStreetMap (ODbL) y de su geocodificador, nunca de Google.
-- Solo aditiva e idempotente.
ALTER TABLE catalogo_salas
    ADD COLUMN IF NOT EXISTS coordenadas_aprox BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS geolocalizada_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_sin_coordenadas ON catalogo_salas (geolocalizada_en NULLS FIRST) WHERE lat IS NULL;
