/**
 * Comentarios más relevantes de un vídeo de YouTube, para sacar las marcas de tiempo
 * ("2:34 🔥") que la gente deja en los momentos que más le gustan.
 *
 * Usa la Data API oficial (1 unidad de cuota por petición, 100 comentarios) y nunca lanza:
 * comentarios desactivados, cuota agotada o red caída devuelven [] y el análisis sigue sin esta
 * señal. Del texto solo se extraen números en `senalesPublico`; no se pasa a ningún prompt.
 */
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

export interface ComentarioVideo {
  texto: string;
  likes: number;
}

interface RespuestaComentarios {
  items?: Array<{ snippet?: { topLevelComment?: { snippet?: { textDisplay?: string; textOriginal?: string; likeCount?: number } } } }>;
}

const TIMEOUT_MS = 6_000;

export async function comentariosDelVideo(videoId: string, fetchFn: typeof fetch = fetch): Promise<ComentarioVideo[]> {
  const clave = (process.env.YOUTUBE_API_KEY || process.env.YT_API_KEY || "").trim();
  if (!clave || !/^[\w-]{11}$/.test(videoId)) return [];
  const url =
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=100&order=relevance&textFormat=plainText` +
    `&videoId=${encodeURIComponent(videoId)}&key=${encodeURIComponent(clave)}`;
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      // 403 = comentarios desactivados o cuota; es lo normal en muchos vídeos, no un error.
      console.log("[YouTube] Comentarios no disponibles (HTTP %s) para %s", res.status, videoId);
      return [];
    }
    const j = (await res.json()) as RespuestaComentarios;
    return (j.items ?? []).flatMap((i) => {
      const c = i.snippet?.topLevelComment?.snippet;
      const texto = String(c?.textOriginal ?? c?.textDisplay ?? "");
      return texto ? [{ texto, likes: Number(c?.likeCount) || 0 }] : [];
    });
  } catch (e) {
    console.log("[YouTube] No se pudieron leer los comentarios de %s:", videoId, comoErrorCapturado(e).message);
    return [];
  }
}
