/**
 * Recogida de métricas reales de los Reels publicados y aprendizaje por banda (Fase 5).
 *
 * Worker cada 15 min: para cada Reel publicado en Instagram en los últimos 8 días, si toca una
 * medición (1 h, 24 h, 72 h, 7 días), lee sus insights con el token de SU banda y la guarda.
 * La duración y el loop del clip se copian al medir para que el aprendizaje lea una sola tabla.
 */
import { dbPostsPublicadosRecientes, dbMedicionesTomadas, dbGuardarMetricaReel, dbUltimasMetricasDeBanda, dbTextosDePosts, type FilaMetricaReel } from "../db/reelMetricas.js";
import { dbBuscarReelClip } from "../db/reelClips.js";
import { cleanBandId } from "../db/core.js";
import { credencialesInstagram } from "./credencialesInstagram.js";
import { leerInsightsReel } from "./publicadores/instagramInsights.js";
import {
  medicionesPendientes,
  kpisDeReel,
  formatoDeClip,
  recomendarFormato,
  resumirAprendizaje,
  type ReelMedido,
  type Recomendacion,
  type ResumenAprendizaje
} from "../utils/aprendizajeReels.js";
import { resumenSemanal, type ResumenSemanal, type ReelSemana } from "../utils/resumenSemanalReels.js";
import { captureError } from "../utils/errorTracking.js";
import type { SocialPost } from "../../src/types.js";

function avisar(contexto: string, e: unknown, extra: Record<string, unknown> = {}): void {
  console.warn(`[Métricas Reels] ${contexto}:`, e);
  captureError(e, { contexto: `metricasReels: ${contexto}`, ...extra });
}

async function medirPost(post: SocialPost, horas: number): Promise<void> {
  const bandId = cleanBandId(post.band_id || "");
  const cred = await credencialesInstagram(bandId);
  if (!cred || !post.published_id) return; // sin cuenta conectada no hay nada que leer
  const [insights, clip] = await Promise.all([
    leerInsightsReel(cred, post.published_id),
    post.video_url ? dbBuscarReelClip(bandId, post.video_url).catch(() => null) : Promise.resolve(null)
  ]);
  await dbGuardarMetricaReel(
    {
      post_id: post.id,
      horas: horas as FilaMetricaReel["horas"],
      published_id: post.published_id,
      duracion_seg: clip?.duracion_seg ?? null,
      loop_perfecto: clip?.loop_perfecto ?? null,
      views: insights.views,
      reach: insights.reach,
      likes: insights.likes,
      comments: insights.comments,
      shares: insights.shares,
      saves: insights.saves,
      avg_watch_ms: insights.avgWatchMs,
      total_watch_ms: insights.totalWatchMs
    },
    bandId
  );
}

let tickEnCurso = false;

export async function tickMetricas(ahora = new Date()): Promise<{ medidos: number }> {
  if (tickEnCurso) return { medidos: 0 };
  tickEnCurso = true;
  let medidos = 0;
  try {
    const posts = (await dbPostsPublicadosRecientes()).filter((p) => p.published_at && p.published_id);
    const tomadas = await dbMedicionesTomadas(posts.map((p) => p.id));
    // En serie: Meta limita por cuenta y no corre prisa; un fallo en un post no frena a los demás.
    for (const post of posts) {
      for (const horas of medicionesPendientes(post.published_at!, tomadas.get(post.id) || [], ahora)) {
        try {
          await medirPost(post, horas);
          medidos++;
        } catch (e) {
          avisar("no se pudo medir un Reel", e, { postId: post.id, horas });
        }
      }
    }
  } catch (e) {
    avisar("pasada del worker", e);
  } finally {
    tickEnCurso = false;
  }
  return { medidos };
}

const TICK_MS = Number(process.env.METRICAS_REELS_INTERVAL_MS) || 15 * 60_000;
let handle: NodeJS.Timeout | null = null;

export function startMetricasReelsScheduler(): void {
  if (handle) return;
  handle = setInterval(() => void tickMetricas(), TICK_MS);
  handle.unref();
  console.log(`[Métricas Reels] Recogida de métricas activa (cada ${Math.round(TICK_MS / 60_000)} min).`);
}

/* --------------------------------------------------------------- aprendizaje */

/** De la fila guardada al Reel medido que entiende el aprendizaje. Sin duración, no cuenta. */
export function reelMedidoDe(f: FilaMetricaReel): ReelMedido | null {
  const duracion = Number(f.duracion_seg);
  if (!Number.isFinite(duracion) || duracion <= 0) return null;
  return {
    formato: formatoDeClip(duracion, Boolean(f.loop_perfecto)),
    ...kpisDeReel({ duracionSeg: duracion, avgWatchMs: f.avg_watch_ms, reach: f.reach, shares: f.shares, saves: f.saves, views: f.views })
  };
}

export interface AprendizajeBanda {
  resumen: ResumenAprendizaje;
  recomendacion: Recomendacion;
}

export async function aprendizajeDeBanda(bandId: string, rng: () => number = Math.random): Promise<AprendizajeBanda> {
  const historial = (await dbUltimasMetricasDeBanda(bandId)).map(reelMedidoDe).filter((r): r is ReelMedido => r !== null);
  return { resumen: resumirAprendizaje(historial), recomendacion: recomendarFormato(historial, rng) };
}

export async function resumenSemanalDeBanda(bandId: string, ahora = new Date(), rng: () => number = Math.random): Promise<ResumenSemanal> {
  const filas = await dbUltimasMetricasDeBanda(bandId);
  const medidos = filas.flatMap((f) => {
    const m = reelMedidoDe(f);
    return m && f.medido_en ? [{ f, m }] : [];
  });
  const textos = await dbTextosDePosts(bandId, medidos.map(({ f }) => f.post_id));
  const reels: ReelSemana[] = medidos.map(({ f, m }) => ({
    postId: f.post_id,
    texto: textos.get(f.post_id) || "Reel sin texto",
    medidoEn: f.medido_en as string,
    formato: m.formato,
    rewatch: m.rewatch,
    tasaCompartir: m.tasaCompartir,
    tasaGuardar: m.tasaGuardar
  }));
  const recomendacion = recomendarFormato(medidos.map(({ m }) => m), rng);
  return resumenSemanal(reels, recomendacion, ahora);
}
