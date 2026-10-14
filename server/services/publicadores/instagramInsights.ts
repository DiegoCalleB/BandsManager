/**
 * Métricas de un Reel publicado (Graph API, /{media-id}/insights) con el token de la banda.
 *
 * Meta retira métricas sin avisar (en 2025 `plays` pasó a `views`). Si la petición falla por
 * una métrica no soportada, se reintenta con el juego anterior; lo que no venga queda en null,
 * nunca en 0: un 0 diría "nadie lo vio" cuando lo cierto es "no lo sabemos".
 * PENDIENTE: validar los nombres con una cuenta real (de momento probado con respuestas simuladas).
 */
import { hostGraphPara, type CredencialesInstagram, type DependenciasGraph } from "./instagramReels.js";

const VERSION_GRAPH = "v21.0";
const METRICAS = ["views", "reach", "likes", "comments", "shares", "saved", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];
/** Juego anterior a la retirada de `plays` (cuentas o versiones que aún no tienen `views`). */
const METRICAS_ANTERIORES = ["plays", "reach", "likes", "comments", "shares", "saved", "ig_reels_avg_watch_time"];

export interface InsightsReel {
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  avgWatchMs: number | null;
  totalWatchMs: number | null;
}

interface RespuestaInsights {
  data?: Array<{ name?: string; values?: Array<{ value?: unknown }>; total_value?: { value?: unknown } }>;
  error?: { message?: string };
}

/** Pura: de la respuesta de Graph a métricas con null donde falte. */
export function parsearInsights(r: RespuestaInsights): InsightsReel {
  const valor = (...nombres: string[]): number | null => {
    for (const nombre of nombres) {
      const m = r.data?.find((d) => d.name === nombre);
      const v = m?.values?.[0]?.value ?? m?.total_value?.value;
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  };
  return {
    views: valor("views", "plays"),
    reach: valor("reach"),
    likes: valor("likes"),
    comments: valor("comments"),
    shares: valor("shares"),
    saves: valor("saved"),
    avgWatchMs: valor("ig_reels_avg_watch_time"),
    totalWatchMs: valor("ig_reels_video_view_total_time")
  };
}

export async function leerInsightsReel(
  cred: CredencialesInstagram,
  mediaId: string,
  deps: Pick<DependenciasGraph, "fetch"> = { fetch: (i, init) => fetch(i, init) }
): Promise<InsightsReel> {
  const pedir = async (metricas: string[]) => {
    const url = `${hostGraphPara(cred.token)}/${VERSION_GRAPH}/${encodeURIComponent(mediaId)}/insights?metric=${metricas.join(",")}&access_token=${encodeURIComponent(cred.token)}`;
    const res = await deps.fetch(url);
    return { ok: res.ok, cuerpo: (await res.json().catch(() => ({}))) as RespuestaInsights };
  };

  let r = await pedir(METRICAS);
  if (!r.ok || r.cuerpo.error) r = await pedir(METRICAS_ANTERIORES);
  if (!r.ok || r.cuerpo.error) {
    throw new Error(`Instagram no devolvió las métricas del Reel: ${r.cuerpo.error?.message || "error desconocido"}`);
  }
  return parsearInsights(r.cuerpo);
}
