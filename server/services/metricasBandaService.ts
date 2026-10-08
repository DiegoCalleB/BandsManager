// Captura mensual de métricas públicas de una banda: Spotify (seguidores, popularidad),
// Deezer (fans) y YouTube (suscriptores, visualizaciones). Cada fuente falla por separado.

import { getSpotifyAccessToken } from "./spotifyService.js";
import { fansDeezerDeBanda } from "./musicPreviewService.js";
import { elegirCanalYoutube } from "../utils/metricasBanda.js";
import { spotifyArtistId } from "../../src/utils/spotifyEmbed.js";
import { getSupabase } from "../db/core.js";

export interface FilaMetrica {
  fuente: "spotify" | "deezer" | "youtube";
  seguidores?: number | null;
  fans?: number | null;
  suscriptores?: number | null;
  visualizaciones?: number | null;
  popularidad?: number | null;
}

async function metricasSpotify(enlace: string): Promise<FilaMetrica | null> {
  const id = spotifyArtistId(enlace);
  const token = id ? await getSpotifyAccessToken() : null;
  if (!id || !token) return null;
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.warn(`[Metricas] Spotify respondió ${res.status} para el artista ${id}`);
      return null;
    }
    const a = (await res.json()) as { followers?: { total?: number }; popularity?: number };
    return { fuente: "spotify", seguidores: a.followers?.total ?? null, popularidad: a.popularity ?? null };
  } catch (err) {
    console.warn("[Metricas] Spotify no disponible:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function metricasYoutube(nombre: string): Promise<FilaMetrica | null> {
  const clave = (process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY || "").trim();
  if (!clave) return null;
  try {
    // search.list cuesta 100 unidades de cuota: por eso solo se hace una vez al mes por banda.
    const busqueda = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(nombre)}&key=${encodeURIComponent(clave)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!busqueda.ok) return null;
    const datos = (await busqueda.json()) as { items?: { id?: { channelId?: string }; snippet?: { channelTitle?: string } }[] };
    const canal = elegirCanalYoutube(
      nombre,
      (datos.items || []).map((i) => ({ channelId: i.id?.channelId || "", channelTitle: i.snippet?.channelTitle || "" })),
    );
    if (!canal) return null;

    const stats = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(canal.channelId)}&key=${encodeURIComponent(clave)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!stats.ok) return null;
    const s = (await stats.json()) as { items?: { statistics?: { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean } }[] };
    const est = s.items?.[0]?.statistics;
    if (!est) return null;
    return {
      fuente: "youtube",
      suscriptores: est.hiddenSubscriberCount ? null : Number(est.subscriberCount ?? NaN) || null,
      visualizaciones: Number(est.viewCount ?? NaN) || null,
    };
  } catch (err) {
    console.warn("[Metricas] YouTube no disponible:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function metricasDeezer(nombre: string): Promise<FilaMetrica | null> {
  const fans = await fansDeezerDeBanda(nombre);
  return fans === null ? null : { fuente: "deezer", fans };
}

/** Todas las fuentes disponibles para una banda. Lo que falle simplemente no aparece. */
export async function capturarMetricasBanda(nombre: string, enlaceSpotify: string): Promise<FilaMetrica[]> {
  const resultados = await Promise.all([
    metricasSpotify(enlaceSpotify),
    metricasDeezer(nombre),
    metricasYoutube(nombre),
  ]);
  return resultados.filter((r): r is FilaMetrica => r !== null);
}

/** Guarda las filas del periodo; un reintento del mismo mes sobrescribe (UNIQUE band_contact_id+fuente+periodo). */
export async function guardarMetricasBanda(
  banda: { id: string; band_id: string },
  periodo: string,
  filas: FilaMetrica[],
): Promise<number> {
  if (filas.length === 0) return 0;
  const { error } = await getSupabase()
    .from("band_metricas")
    .upsert(
      filas.map((f) => ({
        band_id: banda.band_id,
        band_contact_id: banda.id,
        fuente: f.fuente,
        periodo,
        seguidores: f.seguidores ?? null,
        fans: f.fans ?? null,
        suscriptores: f.suscriptores ?? null,
        visualizaciones: f.visualizaciones ?? null,
        popularidad: f.popularidad ?? null,
        capturado_at: new Date().toISOString(),
      })),
      { onConflict: "band_contact_id,fuente,periodo" },
    );
  if (error) throw new Error(`No se pudieron guardar las métricas: ${error.message}`);
  return filas.length;
}
