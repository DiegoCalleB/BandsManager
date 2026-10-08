-- Un enlace por columna en band_contacts (antes spotify_youtube mezclaba Spotify, YouTube y webs).
-- Idempotente: se puede ejecutar varias veces. Rollback: DROP COLUMN de las tres columnas nuevas.
-- spotify_youtube NO se modifica: sigue guardando lo que ya tuviera.

ALTER TABLE band_contacts ADD COLUMN IF NOT EXISTS spotify_artista_url TEXT;
ALTER TABLE band_contacts ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE band_contacts ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Copia de los enlaces existentes. Solo rellena columnas vacías.
UPDATE band_contacts
   SET spotify_artista_url = spotify_youtube
 WHERE (spotify_artista_url IS NULL OR spotify_artista_url = '')
   AND spotify_youtube ~* 'open\.spotify\.com/(intl-[a-z]{2}(-[a-z]{2})?/)?artist/[A-Za-z0-9]{22}';

UPDATE band_contacts
   SET youtube_url = spotify_youtube
 WHERE (youtube_url IS NULL OR youtube_url = '')
   AND spotify_youtube ~* '(youtube\.com|youtu\.be)';
