-- Enlaces de cada banda amiga: una fila por banda y plataforma.
-- Añadir una plataforma nueva es un valor más en el CHECK, sin tocar columnas.
-- Idempotente. Rollback: DROP TABLE enlaces_bandas_amigas.
-- band_contacts y spotify_youtube NO se modifican.

CREATE TABLE IF NOT EXISTS enlaces_bandas_amigas (
  id               BIGSERIAL PRIMARY KEY,
  band_contact_id  TEXT NOT NULL REFERENCES band_contacts(id) ON DELETE CASCADE,
  band_id          TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  plataforma       TEXT NOT NULL CHECK (plataforma IN ('spotify', 'youtube', 'instagram', 'tiktok', 'web')),
  url              TEXT NOT NULL,
  verificado       BOOLEAN NOT NULL DEFAULT FALSE,
  actualizado_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (band_contact_id, plataforma)
);

CREATE INDEX IF NOT EXISTS enlaces_bandas_amigas_band_idx ON enlaces_bandas_amigas (band_id);

-- RLS activado sin políticas: los clientes no leen ni escriben; el backend usa la service role.
ALTER TABLE enlaces_bandas_amigas ENABLE ROW LEVEL SECURITY;

-- Copia de los datos existentes. verificado = false: se re-verificará con el barrido de Spotify.
-- ON CONFLICT: si se ejecuta otra vez, no duplica ni pisa lo ya copiado.

-- Spotify (enlace de artista)
INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'spotify', spotify_youtube
  FROM band_contacts
 WHERE band_id IS NOT NULL
   AND spotify_youtube ~* 'open\.spotify\.com/(intl-[a-z]{2}(-[a-z]{2})?/)?artist/[A-Za-z0-9]{22}'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

-- YouTube
INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'youtube', spotify_youtube
  FROM band_contacts
 WHERE band_id IS NOT NULL
   AND spotify_youtube ~* '(youtube\.com|youtu\.be)'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

-- Web u otro enlace que no es Spotify ni YouTube
INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'web', spotify_youtube
  FROM band_contacts
 WHERE band_id IS NOT NULL
   AND spotify_youtube IS NOT NULL AND spotify_youtube <> ''
   AND spotify_youtube !~* 'spotify\.com|youtube\.com|youtu\.be'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

-- Instagram: el campo instagram puede ser un usuario (@x) o una URL.
INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'instagram',
       CASE WHEN instagram ~* '^https?://' THEN instagram
            ELSE 'https://instagram.com/' || regexp_replace(instagram, '^@', '') END
  FROM band_contacts
 WHERE band_id IS NOT NULL
   AND instagram IS NOT NULL AND trim(instagram) <> ''
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;
