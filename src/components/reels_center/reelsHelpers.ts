/**
 * Helpers puros del Centro de Reels (rangos de tiempo, claves de archivo, copy por red).
 * Viven fuera del componente para poder probarlos y compartirlos entre los hooks de `reels_center/`.
 */
import type { HighlightClip } from "../../utils/reelsUtils";

export interface YoutubeVideoMeta {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  durationKnown: boolean;
  thumbnail: string;
  hasTranscript: boolean;
  transcriptLines: number;
  isLive?: boolean;
}

/** Clave estable para un archivo local: no sube el vídeo, solo permite reconocerlo si se
 * vuelve a abrir el mismo (mismo nombre y tamaño) para recuperar su análisis guardado. */
export function videoKeyDeArchivo(
  file: { name: string; size: number } | null,
): string | undefined {
  if (!file) return undefined;
  return `file:${file.name}-${file.size}`;
}

export function parseRangeTimes(rangeStr?: string) {
  if (!rangeStr) return { start: 0, end: 0, duration: 0 };
  const parts = rangeStr.split("-");
  const startStr = parts[0]?.trim() || "";
  const endStr = parts[1]?.trim() || "";

  const parseTime = (timeStr: string) => {
    const timeParts = timeStr.split(":");
    if (timeParts.length === 3) {
      const hrs = parseInt(timeParts[0], 10) || 0;
      const mins = parseInt(timeParts[1], 10) || 0;
      const secs = parseInt(timeParts[2], 10) || 0;
      return hrs * 3600 + mins * 60 + secs;
    } else if (timeParts.length === 2) {
      const mins = parseInt(timeParts[0], 10) || 0;
      const secs = parseInt(timeParts[1], 10) || 0;
      return mins * 60 + secs;
    } else if (timeParts.length === 1) {
      return parseInt(timeParts[0], 10) || 0;
    }
    return 0;
  };

  const start = parseTime(startStr);
  const end = parseTime(endStr);
  const duration = Math.max(0, end - start);
  return { start, end, duration };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// El tono no es el mismo en cada red (Facebook más institucional, TikTok más gamberro...), así
// que el texto que se propone para programar el post tiene que seguir a la red elegida, no
// enseñar siempre el copy de Instagram aunque el usuario haya marcado TikTok o Facebook.
export function copyForPlatform(
  clip: HighlightClip | undefined | null,
  platform: "Instagram" | "TikTok" | "YouTube" | "Facebook",
): string {
  if (!clip) return "";
  if (platform === "TikTok")
    return clip.copyTikTok || clip.recommendedCopy || "";
  if (platform === "YouTube")
    return clip.copyYouTube || clip.recommendedCopy || "";
  if (platform === "Facebook")
    return clip.copyFacebook || clip.recommendedCopy || "";
  return clip.recommendedCopy || "";
}
