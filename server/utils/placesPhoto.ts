// Fotos de Google Places sin exponer la API key.
//
// Antes se guardaba en `leads.imagen_url` (y se devolvía al navegador) la URL de media de Places
// con `&key=<GOOGLE_PLACES_API_KEY>` dentro: cualquier usuario de cualquier banda podía copiar la
// clave de la plataforma y gastar su cuota. Ahora se guarda una URL de nuestro servidor
// (`/api/places/photo?name=...`) que pide la foto con la clave en una cabecera y redirige a la URL
// pública de Google, que no la lleva.

/** Nombre de recurso de una foto de Places (New): `places/{placeId}/photos/{photoId}`. */
const NOMBRE_FOTO = /^places\/[A-Za-z0-9_-]{1,300}\/photos\/[A-Za-z0-9_-]{1,1000}$/;

export function esNombreFotoPlacesValido(nombre: unknown): nombre is string {
  return typeof nombre === "string" && NOMBRE_FOTO.test(nombre);
}

/** URL que se guarda y se manda al cliente para una foto de Places (sin clave). */
export function urlFotoPlaces(nombre: string): string {
  return `/api/places/photo?name=${encodeURIComponent(nombre)}`;
}

/** Endpoint de media de Places que devuelve el `photoUri` público en JSON (la clave va en cabecera). */
export function urlMediaPlaces(nombre: string): string {
  return `https://places.googleapis.com/v1/${nombre}/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true`;
}
