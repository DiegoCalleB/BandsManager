import type { Song } from "../types";

/**
 * Selector de la transcripción masiva de letras del audio (la cola en sí vive en el servidor:
 * server/services/colaLetras.ts, que reutiliza este mismo selector).
 * Cada canción cuesta una llamada de pago (Whisper + análisis de acordes), así que el selector
 * es estricto: solo canciones con audio y SIN cifrado (nunca se sobrescribe lo que escribió la banda).
 */

export interface ResumenTranscripcion {
  total: number;
  pendientes: Song[];
  sinAudio: number;
  conCifrado: number;
}

const audioDe = (s: Song): string | undefined =>
  s.audioPrincipalUrl || (s as { audioUrl?: string }).audioUrl || undefined;

export function resumirTranscripcion(songs: Song[]): ResumenTranscripcion {
  const candidatas = songs.filter((s) => s && s.id && s.tipo !== "interludio");
  const pendientes: Song[] = [];
  let sinAudio = 0;
  let conCifrado = 0;
  for (const s of candidatas) {
    if (s.cifradoTexto && s.cifradoTexto.trim()) conCifrado++;
    else if (!audioDe(s)) sinAudio++;
    else pendientes.push(s);
  }
  return { total: candidatas.length, pendientes, sinAudio, conCifrado };
}
