import type { SongAudioIdea } from '../types';

export const OFFSET_MAX_SEGUNDOS = 1;
export const PASO_OFFSET_SEGUNDOS = 0.01;

/** Carpeta de Storage de las tomas del Atril: bandas/{banda}/ideas/{canción} (la banda la pone el servidor). */
export function carpetaDeIdea(songId: string): string {
  return `ideas/${songId}`;
}

/**
 * Compensación inicial de latencia (s): lo que tarda el audio en salir por los auriculares y el micro en
 * entrar. Se usa la latencia que reporta el AudioContext; si no hay dato, un valor típico por plataforma.
 */
export function offsetInicial(latenciaReportadaMs: number, userAgent = ''): number {
  const ms = latenciaReportadaMs > 0 ? latenciaReportadaMs : /iPad|iPhone|iPod/.test(userAgent) ? 200 : /Android/i.test(userAgent) ? 160 : 90;
  return limitarOffset(ms / 1000);
}

/** Mantiene el offset en [-1 s, 1 s] y a pasos de 10 ms (sin ruido de coma flotante). */
export function limitarOffset(segundos: number): number {
  if (!Number.isFinite(segundos)) return 0;
  const acotado = Math.max(-OFFSET_MAX_SEGUNDOS, Math.min(OFFSET_MAX_SEGUNDOS, segundos));
  return Math.round(acotado * 100) / 100;
}

/** Título por defecto de una toma: «Idea · Bajo · sin Bajo» o «Idea 3» si no hay instrumento. */
export function tituloDeToma(instrumento: string | undefined, ideas: SongAudioIdea[]): string {
  const n = ideas.filter((i) => i.origen === 'atril').length + 1;
  return instrumento ? `Idea ${n} · ${instrumento}` : `Idea ${n}`;
}

/** Extensión y tipo del fichero según lo que haya grabado el navegador. */
export function ficheroDeToma(mime: string): { extension: string; tipo: string } {
  if (mime.includes('mp4')) return { extension: 'm4a', tipo: 'audio/mp4' };
  if (mime.includes('ogg')) return { extension: 'ogg', tipo: 'audio/ogg' };
  return { extension: 'webm', tipo: 'audio/webm' };
}
