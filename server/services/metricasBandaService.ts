// Captura mensual de métricas públicas de una banda: Spotify (seguidores, popularidad) y
// YouTube (suscriptores, visualizaciones). Cada fuente falla por separado.

import { getSpotifyAccessToken } from "./spotifyService.js";
import { elegirCanalYoutube } from "../utils/metricasBanda.js";
import { elegirArtistaDeezer, ArtistaDeezer } from "../utils/musicPreview.js";
import { canalYoutubeDeEnlace, EnlacesParaMetricas } from "../utils/redesBanda.js";
import { CredencialesInstagram, seguidoresInstagram } from "./instagramDescubrimiento.js";
import { spotifyArtistId } from "../../src/utils/spotifyEmbed.js";
import { getSupabase } from "../db/core.js";

export type Resultado = { fila: FilaMetrica } | { motivo: string };

export interface FilaMetrica {
  fuente: "spotify" | "youtube" | "deezer" | "instagram";
  seguidores?: number | null;
  suscriptores?: number | null;
  visualizaciones?: number | null;
  popularidad?: number | null;
}

async function metricasSpotify(enlace: string): Promise<Resultado> {
  const id = spotifyArtistId(enlace);
  if (!id) return { motivo: "sin enlace de Spotify verificado" };
  const token = await getSpotifyAccessToken();
  if (!token) return { motivo: "Spotify no da token (revisa SPOTIFY_CLIENT_ID/SECRET)" };
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { motivo: `Spotify respondió ${res.status}` };
    const a = (await res.json()) as { followers?: { total?: number }; popularity?: number };
    const seguidores = a.followers?.total ?? null;
    const popularidad = a.popularity ?? null;
    // Spotify contesta 200 pero sin datos: una fila vacía no sirve y se oculta en la app. Mejor avisar.
    if (seguidores === null && popularidad === null) {
      return { motivo: "Spotify respondió sin seguidores ni popularidad (revisar token o cuota de la app)" };
    }
    return { fila: { fuente: "spotify", seguidores, popularidad } };
  } catch (err) {
    return { motivo: `Spotify no responde (${err instanceof Error ? err.message : "error"})` };
  }
}

/** Fans de Deezer: sustituye a los seguidores de Spotify, que la app en modo desarrollo no recibe. */
async function metricasDeezer(nombre: string): Promise<Resultado> {
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(nombre)}&limit=10`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { motivo: `Deezer respondió ${res.status}` };
    const datos = (await res.json()) as { data?: ArtistaDeezer[] };
    const artista = elegirArtistaDeezer(nombre, datos.data || []);
    if (!artista) return { motivo: "Deezer no tiene un artista con ese nombre exacto" };
    if (typeof artista.nb_fan !== "number") return { motivo: "Deezer no devuelve fans" };
    return { fila: { fuente: "deezer", seguidores: artista.nb_fan } };
  } catch (err) {
    return { motivo: `Deezer no responde (${err instanceof Error ? err.message : "error"})` };
  }
}

/** Estadísticas de un canal de YouTube (`filtro`: id=…, forHandle=… o forUsername=…). */
async function estadisticasYoutube(clave: string, filtro: string): Promise<Resultado> {
  const stats = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&${filtro}&key=${encodeURIComponent(clave)}`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!stats.ok) return { motivo: `YouTube respondió ${stats.status} en estadísticas` };
  const s = (await stats.json()) as { items?: { statistics?: { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean } }[] };
  const est = s.items?.[0]?.statistics;
  if (!est) return { motivo: "YouTube no devuelve estadísticas" };
  return {
    fila: {
      fuente: "youtube",
      suscriptores: est.hiddenSubscriberCount ? null : Number(est.subscriberCount ?? NaN) || null,
      visualizaciones: Number(est.viewCount ?? NaN) || null,
    },
  };
}

const PARAMETRO_CANAL = { id: "id", handle: "forHandle", usuario: "forUsername" } as const;

async function metricasYoutube(nombre: string, enlace?: string): Promise<Resultado> {
  const clave = (process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY || "").trim();
  if (!clave) return { motivo: "falta YOUTUBE_API_KEY" };
  try {
    // El canal del enlace guardado es exacto y cuesta 1 unidad; si no resuelve se busca por nombre.
    const directo = canalYoutubeDeEnlace(enlace);
    if (directo) {
      const r = await estadisticasYoutube(clave, `${PARAMETRO_CANAL[directo.tipo]}=${encodeURIComponent(directo.valor)}`);
      if ("fila" in r) return r;
    }

    // search.list cuesta 100 unidades de cuota: por eso solo se hace una vez al mes por banda.
    const busqueda = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(nombre)}&key=${encodeURIComponent(clave)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!busqueda.ok) return { motivo: `YouTube respondió ${busqueda.status} en la búsqueda` };
    const datos = (await busqueda.json()) as { items?: { id?: { channelId?: string }; snippet?: { channelTitle?: string } }[] };
    const canal = elegirCanalYoutube(
      nombre,
      (datos.items || []).map((i) => ({ channelId: i.id?.channelId || "", channelTitle: i.snippet?.channelTitle || "" })),
    );
    if (!canal) return { motivo: "YouTube no tiene un canal con ese nombre exacto" };
    return await estadisticasYoutube(clave, `id=${encodeURIComponent(canal.channelId)}`);
  } catch (err) {
    return { motivo: `YouTube no responde (${err instanceof Error ? err.message : "error"})` };
  }
}

/** Todas las fuentes de una banda: filas válidas y motivos de las que fallan. */
export async function capturarMetricasBanda(
  nombre: string,
  enlaces: EnlacesParaMetricas,
  instagram: CredencialesInstagram,
): Promise<{ filas: FilaMetrica[]; motivos: { fuente: FilaMetrica["fuente"]; motivo: string }[] }> {
  const [sp, dz, ig, yt] = await Promise.all([
    metricasSpotify(enlaces.spotify || ""),
    metricasDeezer(nombre),
    seguidoresInstagram(instagram, enlaces.instagram),
    metricasYoutube(nombre, enlaces.youtube),
  ]);
  const filas: FilaMetrica[] = [];
  const motivos: { fuente: FilaMetrica["fuente"]; motivo: string }[] = [];
  for (const [fuente, r] of [["spotify", sp], ["deezer", dz], ["instagram", ig], ["youtube", yt]] as const) {
    if ("fila" in r) filas.push(r.fila);
    else motivos.push({ fuente, motivo: r.motivo });
  }
  return { filas, motivos };
}

/** Guarda las filas del periodo; un reintento del mismo mes sobrescribe (UNIQUE band_contact_id+fuente+periodo). */
export async function guardarMetricasBanda(
  banda: { id: string; band_id: string },
  periodo: string,
  filas: FilaMetrica[],
): Promise<number> {
  if (filas.length === 0) return 0;
  const { error } = await getSupabase()
    .from("metricas_bandas_amigas")
    .upsert(
      filas.map((f) => ({
        band_id: banda.band_id,
        band_contact_id: banda.id,
        fuente: f.fuente,
        periodo,
        seguidores: f.seguidores ?? null,
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
