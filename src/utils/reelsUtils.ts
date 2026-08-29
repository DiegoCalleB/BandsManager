export interface ReelCard {
  id: string;
  title: string;
  duration: string;
  category: string;
  stage: 'draft' | 'edit' | 'ready';
  ideas: string;
}

export interface HighlightClip {
  id: string;
  range: string;
  title: string;
  description?: string;
  reason?: string;
  virality?: number;
  confidence?: number;
  energyLevel?: string;
  recommendedCopy?: string;
  hashtags?: string[];
  /** Segundos exactos que devuelve el backend, ya recortados a la duración real del vídeo. */
  startSec?: number;
  endSec?: number;
  duration?: number;
  /** Rótulo sobreimpreso para los primeros segundos, que es lo que frena el scroll. */
  hookText?: string;
  copyTikTok?: string;
  copyYouTube?: string;
  copyFacebook?: string;
  cta?: string;
}

export interface OptimalTime {
  day: string;
  date: string;
  time: string;
  reason: string;
}

/**
 * Extracts YouTube video ID from a URL
 */
export function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Parses time range string like "01:15 - 01:45" to start time in seconds
 */
export function getStartTimeInSeconds(rangeStr?: string): number {
  if (!rangeStr) return 0;
  const firstPart = rangeStr.split('-')[0].trim();
  const timeParts = firstPart.split(':');
  if (timeParts.length === 2) {
    const mins = parseInt(timeParts[0], 10) || 0;
    const secs = parseInt(timeParts[1], 10) || 0;
    return mins * 60 + secs;
  } else if (timeParts.length === 1) {
    return parseInt(timeParts[0], 10) || 0;
  }
  return 0;
}

/**
 * Formats seconds into MM:SS format
 */
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Fecha por defecto para programar un post: mañana, en vez de una fecha fija que se queda vieja. */
export function defaultScheduleDate(daysAhead = 1, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export interface ScheduleReadinessInput {
  /** Texto final tal cual se va a publicar (lo que se guarda en SocialPost.contenido). */
  copy: string;
  scheduledDate: string;
  scheduledTime: string;
  /** Inyectable para poder testear sin depender del reloj real. */
  now?: Date;
}

/**
 * Motivos por los que un post NO está listo para programarse. Vacío = listo.
 * Antes solo se comprobaba que el copy no estuviera vacío, en silencio (el botón no hacía
 * nada y no se explicaba por qué): faltaban fecha/hora en el pasado y un hashtag olvidado
 * se descubrían ya con el post en la cola, no al programarlo.
 */
export function validateScheduleReadiness(input: ScheduleReadinessInput): string[] {
  const problemas: string[] = [];
  const copy = (input.copy || '').trim();

  if (!copy) {
    problemas.push('Falta el texto del copy.');
  } else if (!/#\w+/.test(copy)) {
    problemas.push('El copy no lleva ningún hashtag: añade al menos uno.');
  }

  if (!input.scheduledDate || !input.scheduledTime) {
    problemas.push('Elige fecha y hora de publicación.');
  } else {
    const momento = new Date(`${input.scheduledDate}T${input.scheduledTime}`);
    const ahora = input.now || new Date();
    if (!Number.isNaN(momento.getTime()) && momento.getTime() < ahora.getTime()) {
      problemas.push('La fecha y hora elegidas ya han pasado.');
    }
  }

  return problemas;
}
