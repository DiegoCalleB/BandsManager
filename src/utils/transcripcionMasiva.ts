import type { Song } from "../types";

/**
 * Transcripción masiva de letras del audio («Letra del audio» de cada canción, en cola).
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

export type ResultadoCancion = "hecha" | "omitida" | "sin_letra" | "fallida";

export interface ProgresoTranscripcion {
  hechas: number;
  total: number;
  fallidas: string[];
  sinLetra: string[];
}

export interface OpcionesCola {
  /** Transcribe una canción; devuelve el cifrado o lanza (los 409/422 se interpretan abajo). */
  transcribir: (song: Song) => Promise<{ cifradoTexto: string }>;
  alTerminarCancion?: (song: Song, resultado: ResultadoCancion, cifradoTexto?: string) => void;
  alProgresar?: (p: ProgresoTranscripcion) => void;
  signal?: AbortSignal;
  /** Por defecto 1: Replicate se enfada con ráfagas. */
  concurrencia?: number;
}

const estadoDe = (err: unknown): number | undefined => (err as { status?: number })?.status;

export async function transcribirEnCola(
  pendientes: Song[],
  { transcribir, alTerminarCancion, alProgresar, signal, concurrencia = 1 }: OpcionesCola
): Promise<ProgresoTranscripcion> {
  const progreso: ProgresoTranscripcion = { hechas: 0, total: pendientes.length, fallidas: [], sinLetra: [] };
  let siguiente = 0;

  const trabajador = async () => {
    while (siguiente < pendientes.length && !signal?.aborted) {
      const song = pendientes[siguiente++];
      let resultado: ResultadoCancion = "hecha";
      let cifradoTexto: string | undefined;
      try {
        cifradoTexto = (await transcribir(song)).cifradoTexto;
      } catch (err) {
        const estado = estadoDe(err);
        // 409: ya tenía cifrado o ya se estaba procesando → no es un fallo, se deja como está.
        if (estado === 409) resultado = "omitida";
        // 422: audio sin voz inteligible (instrumental) → tampoco es un fallo.
        else if (estado === 422) {
          resultado = "sin_letra";
          progreso.sinLetra.push(song.titulo);
        } else {
          resultado = "fallida";
          progreso.fallidas.push(song.titulo);
        }
      }
      progreso.hechas++;
      alTerminarCancion?.(song, resultado, cifradoTexto);
      alProgresar?.({ ...progreso, fallidas: [...progreso.fallidas], sinLetra: [...progreso.sinLetra] });
    }
  };

  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrencia), pendientes.length) }, trabajador));
  return progreso;
}
