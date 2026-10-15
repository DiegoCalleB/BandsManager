// Elección pura de artista y preview a partir de las respuestas de la API pública de Deezer
// (sin clave). Sin red: el servicio que hace las llamadas vive en services/musicPreviewService.ts.

import { normalizarNombreArtista } from "./spotifyMatch.js";

export interface ArtistaDeezer {
  id: number;
  name: string;
  nb_fan?: number;
  picture_big?: string;
}

export interface TemaDeezer {
  title: string;
  preview?: string;
  album?: { cover_medium?: string };
}

/** Artista con el nombre exacto (tras normalizar); entre homónimos, el de más fans. */
export function elegirArtistaDeezer(nombreBanda: string, candidatos: ArtistaDeezer[]): ArtistaDeezer | null {
  const buscado = normalizarNombreArtista(nombreBanda);
  if (!buscado) return null;
  const coincidencias = (candidatos || []).filter(
    (a) => typeof a?.id === "number" && normalizarNombreArtista(a.name || "") === buscado,
  );
  coincidencias.sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
  return coincidencias[0] || null;
}

/** Primer tema con un preview de 30 s servido por https (el resto no sirve para la cola). */
export function elegirPreview(temas: TemaDeezer[]): TemaDeezer | null {
  return (temas || []).find((t) => typeof t?.preview === "string" && /^https:\/\//.test(t.preview)) || null;
}

/** Todos los temas con preview https (máx. `limite`), en el orden del top de Deezer. */
export function elegirPreviews(temas: TemaDeezer[], limite = 10): TemaDeezer[] {
  return (temas || [])
    .filter((t) => typeof t?.preview === "string" && /^https:\/\//.test(t.preview))
    .slice(0, limite);
}
