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
  copyViral?: string;
  copyComunidad?: string;
  copyConversion?: string;
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
  lengthCategory?: 'micro_hook' | 'hit_moment' | 'story_bts';
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface OptimalTime {
  day: string;
  date: string;
  time: string;
  reason: string;
}

/**
 * Parses time range string like "01:15 - 01:45" or "01:15-01:45" into start, end, duration numbers
 */
export function parseRangeTimes(rangeStr?: string): { start: number; end: number; duration: number } {
  if (!rangeStr) return { start: 0, end: 0, duration: 0 };
  const parts = rangeStr.split('-').map(p => p.trim());
  if (parts.length < 2) return { start: 0, end: 0, duration: 0 };

  const parsePart = (p: string) => {
    const sub = p.split(':').map(Number);
    if (sub.length === 2) return (sub[0] || 0) * 60 + (sub[1] || 0);
    if (sub.length === 3) return (sub[0] || 0) * 3600 + (sub[1] || 0) * 60 + (sub[2] || 0);
    return Number(p) || 0;
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);
  const duration = Math.max(0, end - start);
  return { start, end, duration };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

export interface CadenceCheckInput {
  posts: Array<{ fecha: string; plataforma: string }>;
  platform: string;
  scheduledDate: string;
  scheduledTime: string;
  /** Por debajo de esto, dos posts en la misma red se consideran "pegados". */
  minHoursBetweenSamePlatform?: number;
  /** Por encima de esto, un hueco sin publicar nada antes de este post merece aviso. */
  maxDaysGapWarning?: number;
}

/**
 * Avisos de cadencia (NO bloqueantes: son sobre estrategia de publicación, no sobre si el
 * post en sí está bien formado). Antes no había ninguna señal de que dos Reels quedaran
 * pegados en la misma red, o de que hubiera pasado mucho tiempo sin publicar nada.
 */
export function getCadenceWarnings(input: CadenceCheckInput): string[] {
  const avisos: string[] = [];
  const objetivo = new Date(`${input.scheduledDate}T${input.scheduledTime}`);
  if (!input.scheduledDate || !input.scheduledTime || Number.isNaN(objetivo.getTime())) return avisos;

  const minHoras = input.minHoursBetweenSamePlatform ?? 4;
  const maxDiasHueco = input.maxDaysGapWarning ?? 10;

  const conFecha = (input.posts || [])
    .map((p) => ({ ...p, ts: new Date((p.fecha || '').replace(' ', 'T')).getTime() }))
    .filter((p) => !Number.isNaN(p.ts));

  const mismaRedCercana = conFecha.find(
    (p) => p.plataforma === input.platform && Math.abs(p.ts - objetivo.getTime()) < minHoras * 3600 * 1000
  );
  if (mismaRedCercana) {
    avisos.push(`Ya tienes otro post en ${input.platform} programado a menos de ${minHoras}h de esta fecha y hora.`);
  }

  const anteriores = conFecha.filter((p) => p.ts < objetivo.getTime());
  if (anteriores.length > 0) {
    const ultimo = Math.max(...anteriores.map((p) => p.ts));
    const diasHueco = (objetivo.getTime() - ultimo) / (24 * 3600 * 1000);
    if (diasHueco > maxDiasHueco) {
      avisos.push(`Llevas ${Math.round(diasHueco)} días sin nada programado antes de este post: la constancia pesa más que un post suelto.`);
    }
  }

  return avisos;
}
