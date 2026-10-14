-- Quita la API key de Google Places de las URLs de foto ya guardadas.
-- Antes se guardaba en imagen_url la URL de media de Places con &key=<GOOGLE_PLACES_API_KEY>,
-- que llegaba al navegador de cualquier usuario. Se reescribe al endpoint del servidor
-- /api/places/photo?name=<places/{id}/photos/{id}> (ver server/utils/placesPhoto.ts), con las
-- barras codificadas igual que encodeURIComponent.
-- Idempotente: solo toca filas que todavía llevan la URL de Google con la clave.
UPDATE leads
SET imagen_url = '/api/places/photo?name=' || replace(
  substring(imagen_url FROM 'places\.googleapis\.com/v1/(places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+)/media'),
  '/', '%2F')
WHERE imagen_url ~ 'places\.googleapis\.com/v1/places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+/media.*[?&]key=';

UPDATE band_contacts
SET imagen_url = '/api/places/photo?name=' || replace(
  substring(imagen_url FROM 'places\.googleapis\.com/v1/(places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+)/media'),
  '/', '%2F')
WHERE imagen_url ~ 'places\.googleapis\.com/v1/places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+/media.*[?&]key=';
