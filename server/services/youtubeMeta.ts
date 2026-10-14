/**
 * Ficha de un vídeo de YouTube (título, canal, duración, capítulos) probando varias fuentes.
 * Extraído de `routes/reels.ts` sin cambios de comportamiento.
 */
import ytdl from "@distube/ytdl-core";
import {
  metadatosDataApi,
  metadatosYtDlp,
  fusionarMetadatos,
  metadatosVacios,
  ytDlpDisponible,
  tieneClaveDataApi,
  type CapituloVideo,
  type MetadatosVideo
} from "../utils/youtubeSource.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

/** Respuesta de oEmbed de YouTube. */
interface OembedYoutube {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

export function getYouTubeId(urlStr?: string): string | null {
  if (!urlStr) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  const match = String(urlStr).match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}

/** URL canónica, para no pasarle a ytdl lo que haya escrito el usuario. */
export function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/* --------------------------------------------------------------- YouTube I/O */

export interface YoutubeMeta {
  videoId: string;
  title: string;
  description: string;
  author: string;
  duration: number;
  thumbnail: string;
  isLive: boolean;
  /** Marcados a mano por quien subió el vídeo: la mejor pista para elegir cortes. */
  chapters: CapituloVideo[];
  /** De dónde salió la ficha, para poder depurar por qué falta la duración. */
  fuente: MetadatosVideo["fuente"];
}

export function metaVacia(videoId: string): YoutubeMeta {
  return {
    videoId,
    title: "",
    description: "",
    author: "",
    duration: 0,
    thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
    isLive: false,
    chapters: [],
    fuente: "ninguna"
  };
}

/**
 * Ficha del vídeo, probando de la fuente más fiable a la menos:
 *   1. Data API oficial: no la bloquea el antibot y da la duración exacta.
 *   2. yt-dlp: aguanta el antibot y es el único que trae los capítulos.
 *   3. oEmbed: público, pero sin duración.
 *   4. ytdl-core: último recurso, el primero que YouTube tumba desde un datacenter.
 * En cuanto tenemos título y duración paramos: lo demás es gastar tiempo de petición.
 */
export async function fetchYoutubeMeta(videoId: string): Promise<YoutubeMeta> {
  const meta = metaVacia(videoId);
  const url = canonicalYouTubeUrl(videoId);
  let acumulado = metadatosVacios();

  const completa = () => Boolean(acumulado.title) && acumulado.duration > 0;

  if (tieneClaveDataApi()) {
    acumulado = fusionarMetadatos(acumulado, await metadatosDataApi(videoId));
  }

  // yt-dlp aunque la Data API ya haya respondido, si aún faltan los capítulos y está instalado:
  // saber que el vídeo trae capítulos cambia por completo la calidad de los cortes.
  if (!completa() || (acumulado.chapters.length === 0 && (await ytDlpDisponible()))) {
    acumulado = fusionarMetadatos(acumulado, await metadatosYtDlp(url));
  }

  if (!completa()) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedRes.ok) {
        const oembed = (await oembedRes.json()) as OembedYoutube;
        acumulado = fusionarMetadatos(acumulado, {
          ...metadatosVacios(),
          title: oembed?.title || "",
          author: oembed?.author_name || "",
          thumbnail: oembed?.thumbnail_url || "",
          fuente: "oembed"
        });
      }
    } catch {
      /* oEmbed caído o vídeo privado: seguimos con ytdl-core */
    }
  }

  if (!completa()) {
    try {
      const info = await ytdl.getBasicInfo(url);
      const detalles = info?.videoDetails;
      if (detalles) {
        const miniaturas = detalles.thumbnails;
        acumulado = fusionarMetadatos(acumulado, {
          ...metadatosVacios(),
          title: detalles.title || "",
          description: detalles.description || "",
          author: detalles.author?.name || "",
          duration: parseInt(detalles.lengthSeconds, 10) || 0,
          thumbnail: Array.isArray(miniaturas) && miniaturas.length ? miniaturas[miniaturas.length - 1]?.url || "" : "",
          fuente: "ytdl-core"
        });
        meta.isLive = Boolean(detalles.isLiveContent && !detalles.lengthSeconds);
      }
    } catch (eCapturado) {
      const e = comoErrorCapturado(eCapturado);
      // YouTube bloquea getBasicInfo desde IPs de datacenter. No es fatal: con la Data API
      // o yt-dlp por delante, aquí ya casi nunca hace falta llegar.
      console.log("[Reels] getBasicInfo no disponible para %s:", videoId, e?.message || e);
    }
  }

  meta.title = acumulado.title;
  meta.description = acumulado.description;
  meta.author = acumulado.author;
  meta.duration = acumulado.duration;
  meta.chapters = acumulado.chapters;
  meta.fuente = acumulado.fuente;
  if (acumulado.thumbnail) meta.thumbnail = acumulado.thumbnail;

  return meta;
}

