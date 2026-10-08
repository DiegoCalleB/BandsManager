// Previews de 30 s de una banda, vía la API pública de Deezer (sin clave).
// Host fijo: nunca se llama a una URL que venga del usuario.

import { elegirArtistaDeezer, elegirPreviews, ArtistaDeezer, TemaDeezer } from "../utils/musicPreview.js";

export interface TemaPreview {
  titulo: string;
  preview: string;
  imagen: string;
}

export interface PreviewBanda {
  artista: string;
  imagen: string;
  fans: number;
  temas: TemaPreview[];
}

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { valor: PreviewBanda | null; expira: number }>();

interface RespuestaDeezer {
  data?: unknown[];
  error?: { message?: string; type?: string };
}

async function getJson(url: string): Promise<RespuestaDeezer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Deezer respondió ${res.status}`);
  const data = (await res.json()) as RespuestaDeezer;
  // Deezer devuelve errores con HTTP 200 dentro del JSON.
  if (data?.error) throw new Error(`Deezer: ${data.error.message || data.error.type}`);
  return data;
}

/** Preview de la banda, o null si no hay artista exacto o ningún tema con preview. Cachea 24 h. */
export async function previewDeBanda(nombreBanda: string): Promise<PreviewBanda | null> {
  const clave = nombreBanda.trim().toLowerCase();
  const previo = cache.get(clave);
  if (previo && previo.expira > Date.now()) return previo.valor;

  try {
    const busqueda = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(nombreBanda)}&limit=10`);
    const artista = elegirArtistaDeezer(nombreBanda, (busqueda.data || []) as ArtistaDeezer[]);
    let valor: PreviewBanda | null = null;
    if (artista) {
      const top = await getJson(`https://api.deezer.com/artist/${artista.id}/top?limit=10`);
      const temas = elegirPreviews((top.data || []) as TemaDeezer[], 10);
      if (temas.length > 0) {
        valor = {
          artista: artista.name,
          imagen: artista.picture_big || "",
          fans: artista.nb_fan || 0,
          temas: temas.map((t) => ({
            titulo: t.title,
            preview: t.preview as string,
            imagen: t.album?.cover_medium || "",
          })),
        };
      }
    }
    cache.set(clave, { valor, expira: Date.now() + TTL_MS });
    return valor;
  } catch (err) {
    // Los fallos de red no se cachean: se reintenta en la siguiente pulsación.
    console.warn(`[MusicPreview] No se pudo consultar Deezer para "${nombreBanda}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Fans de la banda en Deezer (nombre exacto), o null. Sin clave. */
export async function fansDeezerDeBanda(nombreBanda: string): Promise<number | null> {
  try {
    const busqueda = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(nombreBanda)}&limit=10`);
    const artista = elegirArtistaDeezer(nombreBanda, (busqueda.data || []) as ArtistaDeezer[]);
    return artista ? artista.nb_fan || 0 : null;
  } catch (err) {
    console.warn(`[MusicPreview] fans Deezer no disponibles para "${nombreBanda}":`, err instanceof Error ? err.message : err);
    return null;
  }
}
