-- Añade la variación interna de energía detectada automáticamente del audio de cada canción
-- (partes lentas/rápidas dentro del propio tema), usada por el Mapa de Energía del Show.

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS energia_variacion NUMERIC,
ADD COLUMN IF NOT EXISTS energia_variacion_calculada_en TIMESTAMPTZ;

COMMENT ON COLUMN songs.energia_variacion IS '0-10: cuánto varía la energía dentro del tema (subidas/bajadas internas), medido automáticamente con ffmpeg sobre audio_principal_url';
COMMENT ON COLUMN songs.energia_variacion_calculada_en IS 'Timestamp del último análisis automático de dinámica interna, para saber si hay que reanalizar tras resubir el audio';
