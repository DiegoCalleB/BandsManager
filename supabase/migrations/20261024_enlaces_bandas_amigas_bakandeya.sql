-- Copia de los enlaces de band_contacts a enlaces_bandas_amigas, SOLO de la banda Bakandeya.
-- Complementa 20261023 (que no filtraba por banda). Idempotente: ON CONFLICT no duplica.
-- band_id de Bakandeya: 'band-bakandeya' (ver server/state.ts BAKANDEYA_BAND_ID).

INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'spotify', spotify_youtube
  FROM band_contacts
 WHERE band_id IN ('band-bakandeya', 'bakandeya')
   AND spotify_youtube ~* 'open\.spotify\.com/(intl-[a-z]{2}(-[a-z]{2})?/)?artist/[A-Za-z0-9]{22}'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'youtube', spotify_youtube
  FROM band_contacts
 WHERE band_id IN ('band-bakandeya', 'bakandeya')
   AND spotify_youtube ~* '(youtube\.com|youtu\.be)'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'web', spotify_youtube
  FROM band_contacts
 WHERE band_id IN ('band-bakandeya', 'bakandeya')
   AND spotify_youtube IS NOT NULL AND spotify_youtube <> ''
   AND spotify_youtube !~* 'spotify\.com|youtube\.com|youtu\.be'
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;

INSERT INTO enlaces_bandas_amigas (band_contact_id, band_id, plataforma, url)
SELECT id, band_id, 'instagram',
       CASE WHEN instagram ~* '^https?://' THEN instagram
            ELSE 'https://instagram.com/' || regexp_replace(instagram, '^@', '') END
  FROM band_contacts
 WHERE band_id IN ('band-bakandeya', 'bakandeya')
   AND instagram IS NOT NULL AND trim(instagram) <> ''
ON CONFLICT (band_contact_id, plataforma) DO NOTHING;
