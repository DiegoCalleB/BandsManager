/**
 * Publicación de posts sociales en las plataformas reales.
 *
 * Sustituye a una versión anterior que SIMULABA la publicación: inventaba un id y una URL,
 * marcaba el post como publicado y le añadía visitas y seguidores aleatorios. Ahora un post solo
 * pasa a 'publicado' con el id que devuelve la plataforma. Cuando no se puede publicar de forma
 * automática (plataforma sin integración, Instagram sin conectar, clip sin derechos acreditados)
 * se dice exactamente por qué y el post queda listo para publicación asistida (subirlo a mano y
 * marcarlo como publicado).
 */
import { dbGetSocialPosts, dbUpsertSocialPost, dbReclamarPostParaPublicar, dbGetPostsPorPublicar } from "../db/social.js";
import { dbGetEpkConfig } from "../db/epk.js";
import { dbGetBandSchedule } from "../db/schedule.js";
import { dbBuscarReelClip, type ReelClip } from "../db/reelClips.js";
import { cleanBandId } from "../db/core.js";
import { publicarReelInstagram, type CredencialesInstagram } from "./publicadores/instagramReels.js";
import { postsVencidos, estaColgadoPublicando } from "../utils/programacionPosts.js";
import { captureError } from "../utils/errorTracking.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";
import type { SocialPost } from "../../src/types.js";

export interface PublishResult {
  success: boolean;
  postId: string;
  platform: string;
  publishedId?: string;
  publishedUrl?: string;
  error?: string;
  /** 'asistido' = no se puede publicar solo; `error` dice por qué y qué hacer. */
  modo?: "publicado" | "asistido" | "fallido";
}

/** Log siempre (Sentry puede estar apagado) y a Sentry si está activo. */
function avisar(contexto: string, e: unknown, extra: Record<string, unknown> = {}): void {
  console.warn(`[Social Publisher] ${contexto}:`, e);
  captureError(e, { contexto: `socialPublisher: ${contexto}`, ...extra });
}

/** Un humano pulsando "publicar ya" puede reintentar un fallido o publicar un borrador. */
const ESTADOS_PUBLICACION_MANUAL: SocialPost["estado"][] = ["borrador", "aprobado", "en_cola", "fallido"];
/** El worker solo publica lo que un humano dejó aprobado o en cola. */
const ESTADOS_PUBLICACION_PROGRAMADA: SocialPost["estado"][] = ["aprobado", "en_cola"];

/**
 * Por qué este post NO puede publicarse automáticamente, o null si sí puede. Pura: todo lo que
 * decide llega como argumento.
 */
export function motivoParaNoAutopublicar(
  post: SocialPost,
  credenciales: CredencialesInstagram | null,
  clip: Pick<ReelClip, "derechos"> | null
): string | null {
  if ((post.plataforma || "Instagram") !== "Instagram") {
    return `La publicación automática en ${post.plataforma} aún no está disponible: descarga el vídeo, súbelo desde la app y marca el post como publicado.`;
  }
  if (!post.video_url || !/^https:\/\//.test(post.video_url) || /youtu\.?be/.test(post.video_url)) {
    return "Este post no tiene un clip renderizado y guardado en la nube: renderiza el corte antes de publicarlo.";
  }
  if (!credenciales) {
    return "Instagram no está conectado con una cuenta profesional: conéctalo en Métricas para publicar automáticamente.";
  }
  if (!clip?.derechos) {
    return "No consta que el vídeo de origen sea de la banda (su canal no coincide con el YouTube de la banda). Para evitar un strike de copyright no se publica solo: súbelo tú si tienes los derechos.";
  }
  return null;
}

async function credencialesInstagram(bandId: string): Promise<CredencialesInstagram | null> {
  const epk = await dbGetEpkConfig(bandId).catch((e: unknown) => {
    console.warn("[Social Publisher] No se pudo leer la conexión de Instagram:", e);
    return null;
  });
  const redes = (epk?.enlacesRedes || {}) as Record<string, unknown>;
  const token = typeof redes.instagram_access_token === "string" ? redes.instagram_access_token : "";
  const igUserId = typeof redes.instagram_account_id === "string" ? redes.instagram_account_id : "";
  return token && igUserId ? { token, igUserId } : null;
}

async function evaluar(post: SocialPost, bandId: string): Promise<{ motivo: string | null; credenciales: CredencialesInstagram | null }> {
  const credenciales = await credencialesInstagram(bandId);
  const clip = post.video_url ? await dbBuscarReelClip(bandId, post.video_url).catch((e: unknown) => {
    console.warn("[Social Publisher] No se pudo comprobar la procedencia del clip:", e);
    return null;
  }) : null;
  return { motivo: motivoParaNoAutopublicar(post, credenciales, clip), credenciales };
}

function textoDelPost(post: SocialPost): string {
  const hashtags = (post.hashtags || []).filter((h) => !post.contenido?.includes(h)).join(" ");
  return [post.contenido || "", hashtags].filter(Boolean).join("\n\n");
}

async function publicar(
  post: SocialPost,
  bandId: string,
  desde: SocialPost["estado"][]
): Promise<PublishResult> {
  const platform = post.plataforma || "Instagram";
  const { motivo, credenciales } = await evaluar(post, bandId);
  if (motivo || !credenciales) {
    return { success: false, postId: post.id, platform, modo: "asistido", error: motivo || "Sin credenciales." };
  }

  const reclamado = await dbReclamarPostParaPublicar(post.id, bandId, desde);
  if (!reclamado) {
    return { success: false, postId: post.id, platform, modo: "fallido", error: "Este post ya se está publicando o ya no está pendiente." };
  }

  try {
    const r = await publicarReelInstagram(credenciales, { videoUrl: post.video_url!, caption: textoDelPost(reclamado) });
    await dbUpsertSocialPost(
      // publish_error ya lo dejó a null el reclamo.
      { ...reclamado, estado: "publicado", published_id: r.publishedId, published_at: new Date().toISOString() },
      bandId
    );
    console.log(`[Social Publisher] Post ${post.id} publicado en Instagram (${r.publishedId}).`);
    return { success: true, postId: post.id, platform, publishedId: r.publishedId, publishedUrl: r.permalink, modo: "publicado" };
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error(`[Social Publisher] Error publicando ${post.id} en ${platform}:`, err);
    await dbUpsertSocialPost({ ...reclamado, estado: "fallido", publish_error: err.message }, bandId).catch((e: unknown) =>
      avisar("no se pudo marcar el post como fallido", e, { postId: post.id })
    );
    return { success: false, postId: post.id, platform, modo: "fallido", error: err.message };
  }
}

/** Publica ya un post concreto (acción explícita de la banda). */
export async function publishSocialPostNow(postId: string, bandId: string): Promise<PublishResult> {
  const cleanId = cleanBandId(bandId);
  const post = (await dbGetSocialPosts(cleanId)).find((p: SocialPost) => p.id === postId);
  if (!post) return { success: false, postId, platform: "unknown", error: "Publicación no encontrada." };
  return publicar(post, cleanId, ESTADOS_PUBLICACION_MANUAL);
}

/**
 * Publica los posts vencidos de una banda. Lo que no se puede publicar solo pasa a 'fallido' con
 * el motivo: si se quedara aprobado, el worker lo reintentaría cada minuto para siempre.
 */
async function publicarVencidosDeBanda(bandId: string, posts: SocialPost[], ahora: Date): Promise<PublishResult[]> {
  const zona = (await dbGetBandSchedule(bandId).catch(() => null))?.timezone;
  const resultados: PublishResult[] = [];

  for (const colgado of posts.filter((p) => estaColgadoPublicando(p, ahora))) {
    await dbUpsertSocialPost(
      { ...colgado, estado: "fallido", publish_error: "La publicación se interrumpió. Comprueba en Instagram si llegó a salir antes de reintentarla." },
      bandId
    );
  }

  for (const post of postsVencidos(posts, zona, ahora)) {
    const r = await publicar(post, bandId, ESTADOS_PUBLICACION_PROGRAMADA);
    if (r.modo === "asistido") {
      await dbUpsertSocialPost({ ...post, estado: "fallido", publish_error: r.error }, bandId);
    }
    resultados.push(r);
  }
  return resultados;
}

/** Disparo manual por banda (POST /social/run-scheduled-publisher). */
export async function publishDueScheduledPosts(bandId: string): Promise<{ dispatched: number; results: PublishResult[] }> {
  const cleanId = cleanBandId(bandId);
  const results = await publicarVencidosDeBanda(cleanId, await dbGetSocialPosts(cleanId), new Date());
  return { dispatched: results.length, results };
}

/* ------------------------------------------------------------------ worker */

const TICK_MS = Number(process.env.SOCIAL_PUBLISHER_INTERVAL_MS) || 60_000;
let handle: NodeJS.Timeout | null = null;
let tickEnCurso = false;

export async function tickPublicador(ahora = new Date()): Promise<void> {
  if (tickEnCurso) return;
  tickEnCurso = true;
  try {
    const porBanda = new Map<string, SocialPost[]>();
    for (const p of await dbGetPostsPorPublicar()) {
      const bandId = cleanBandId(p.band_id || "");
      if (!bandId) continue;
      porBanda.set(bandId, [...(porBanda.get(bandId) || []), p]);
    }
    // Banda a banda y en serie: un fallo en una no frena a las demás, y Meta limita por cuenta.
    for (const [bandId, posts] of porBanda) {
      await publicarVencidosDeBanda(bandId, posts, ahora).catch((e: unknown) =>
        avisar("pasada de banda", e, { bandId })
      );
    }
  } catch (e) {
    avisar("pasada del worker", e);
  } finally {
    tickEnCurso = false;
  }
}

export function startSocialPublisherScheduler(): void {
  if (handle) return;
  handle = setInterval(() => void tickPublicador(), TICK_MS);
  handle.unref();
  console.log(`[Social Publisher] Worker de publicación programada activo (cada ${Math.round(TICK_MS / 1000)} s).`);
}
