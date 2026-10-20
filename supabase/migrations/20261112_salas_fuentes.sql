-- Procedencia de cada sala del catálogo: de dónde salió su información pública («osm» = OpenStreetMap, ODbL).
-- El directorio público de salas la usa para citar a OpenStreetMap cuando toca. Solo aditiva e idempotente: las salas
-- que ya existen quedan con la lista vacía (sus datos vienen de los leads de las bandas) y la sincronización normal
-- no escribe esta columna, así que nunca la pisa.
ALTER TABLE salas_catalogo
    ADD COLUMN IF NOT EXISTS fuentes TEXT[] NOT NULL DEFAULT '{}';
