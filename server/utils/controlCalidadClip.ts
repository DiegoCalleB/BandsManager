/**
 * Control de calidad de un clip antes de publicarlo (Fase 6 del plan de Reels).
 *
 * Nada de esto lo ve un test de texto: un MP4 sin audio, un tramo en negro al principio o una
 * imagen congelada salen de ffmpeg sin ningún error. Aquí se parsea lo que mide ffmpeg y se
 * decide. Los *bloqueantes* impiden la autopublicación; los *avisos* se enseñan pero no frenan
 * (un silencio puede ser una pausa dramática buscada).
 */
import { formatMMSS } from "./reelsCore.js";

export interface Tramo {
  inicio: number;
  duracion: number;
}

export interface MedicionClip {
  ancho: number;
  alto: number;
  duracion: number;
  tieneAudio: boolean;
  /** Sonoridad integrada (LUFS). null si no hay audio o no se pudo medir. */
  lufs: number | null;
  negros: Tramo[];
  congelados: Tramo[];
  silencios: Tramo[];
}

export interface ExpectativasClip {
  hookPedido: boolean;
  hookQuemado: boolean;
  volumenNormalizado: boolean;
}

export type CodigoProblema = "sin_audio" | "negro" | "congelado" | "silencio" | "volumen" | "formato" | "duracion" | "hook";

export interface ProblemaCalidad {
  codigo: CodigoProblema;
  mensaje: string;
}

export interface InformeCalidad {
  aprobado: boolean;
  bloqueantes: ProblemaCalidad[];
  avisos: ProblemaCalidad[];
}

/** Umbrales. Exportados para que el detector de ffmpeg use los mismos mínimos. */
export const UMBRALES = {
  negroAvisoSeg: 0.5,
  negroBloqueoSeg: 1,
  congeladoAvisoSeg: 2,
  congeladoBloqueoSeg: 3,
  silencioAvisoSeg: 1.5,
  lufsObjetivo: -14,
  lufsAvisoLu: 1,
  lufsBloqueoLu: 2,
  duracionMinSeg: 3,
  duracionMaxSeg: 90
} as const;

const en = (t: Tramo) => `en ${formatMMSS(t.inicio)} (${t.duracion.toFixed(1)} s)`;

/** Tramos de un tipo: el más largo decide si bloquea o avisa, y el mensaje cita cuál es. */
function juzgarTramos(
  tramos: Tramo[],
  codigo: CodigoProblema,
  texto: string,
  avisoSeg: number,
  bloqueoSeg: number,
  bloqueantes: ProblemaCalidad[],
  avisos: ProblemaCalidad[]
): void {
  const peor = [...tramos].sort((a, b) => b.duracion - a.duracion)[0];
  if (!peor || peor.duracion < avisoSeg) return;
  (peor.duracion >= bloqueoSeg ? bloqueantes : avisos).push({ codigo, mensaje: `${texto} ${en(peor)}.` });
}

export function evaluarCalidadClip(m: MedicionClip, esperado: ExpectativasClip): InformeCalidad {
  const bloqueantes: ProblemaCalidad[] = [];
  const avisos: ProblemaCalidad[] = [];
  const u = UMBRALES;

  if (m.ancho !== 1080 || m.alto !== 1920) {
    bloqueantes.push({ codigo: "formato", mensaje: `El vídeo sale a ${m.ancho}x${m.alto}; un Reel tiene que ser 1080x1920 (9:16).` });
  }
  if (m.duracion < u.duracionMinSeg || m.duracion > u.duracionMaxSeg) {
    bloqueantes.push({ codigo: "duracion", mensaje: `Dura ${m.duracion.toFixed(1)} s; tiene que estar entre ${u.duracionMinSeg} y ${u.duracionMaxSeg} s.` });
  }
  if (!m.tieneAudio) {
    bloqueantes.push({ codigo: "sin_audio", mensaje: "El vídeo no tiene pista de audio." });
  }
  if (esperado.hookPedido && !esperado.hookQuemado) {
    bloqueantes.push({ codigo: "hook", mensaje: "Se pidió un rótulo de enganche y no se ha incrustado." });
  }

  juzgarTramos(m.negros, "negro", "Hay imagen en negro", u.negroAvisoSeg, u.negroBloqueoSeg, bloqueantes, avisos);
  juzgarTramos(m.congelados, "congelado", "La imagen se congela", u.congeladoAvisoSeg, u.congeladoBloqueoSeg, bloqueantes, avisos);
  // Un silencio nunca bloquea: puede ser una pausa buscada antes del estribillo.
  juzgarTramos(m.silencios, "silencio", "Hay silencio", u.silencioAvisoSeg, Infinity, bloqueantes, avisos);

  if (m.tieneAudio && esperado.volumenNormalizado && m.lufs !== null) {
    const desvio = Math.abs(m.lufs - u.lufsObjetivo);
    if (desvio > u.lufsAvisoLu) {
      (desvio > u.lufsBloqueoLu ? bloqueantes : avisos).push({
        codigo: "volumen",
        mensaje: `El volumen es ${m.lufs.toFixed(1)} LUFS; el objetivo de las redes es ${u.lufsObjetivo} LUFS.`
      });
    }
  }

  return { aprobado: bloqueantes.length === 0, bloqueantes, avisos };
}

/* ---------------------------------------------------------------- parseo de ffmpeg */

const num = (v: string | undefined) => (v === undefined ? NaN : Number(v));

/**
 * @param info     stderr de `ffmpeg -i clip.mp4` (formato, pistas, duración).
 * @param analisis stderr de la pasada con blackdetect/freezedetect/silencedetect/ebur128.
 */
export function parsearMedicionFfmpeg(info: string, analisis: string): MedicionClip {
  const dim = /Video: .*?(\d{2,5})x(\d{2,5})/.exec(info);
  const dur = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(info);
  const duracion = dur ? num(dur[1]) * 3600 + num(dur[2]) * 60 + num(dur[3]) : 0;
  const tieneAudio = /Stream #\d+:\d+.*: Audio:/.test(info);

  const negros = [...analisis.matchAll(/black_start:(-?[\d.]+) black_end:[\d.]+ black_duration:([\d.]+)/g)].map((x) => ({
    inicio: num(x[1]),
    duracion: num(x[2])
  }));

  const congelados: Tramo[] = [];
  for (const x of analisis.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)) {
    congelados.push({ inicio: num(x[1]), duracion: num(x[2]) });
  }

  const silencios: Tramo[] = [];
  const inicios = [...analisis.matchAll(/silence_start: (-?[\d.]+)/g)].map((x) => Math.max(0, num(x[1])));
  const duraciones = [...analisis.matchAll(/silence_duration: ([\d.]+)/g)].map((x) => num(x[1]));
  inicios.forEach((inicio, i) => {
    // Un silencio que llega hasta el final no tiene línea de cierre: dura hasta el final del clip.
    const d = duraciones[i] ?? Math.max(0, duracion - inicio);
    silencios.push({ inicio, duracion: Math.round(d * 1000) / 1000 });
  });

  // ebur128 imprime una línea por cada 100 ms; la integrada de verdad es la del resumen final.
  const resumen = analisis.split("Summary:").at(-1) || "";
  const lufs = /\bI:\s+(-?[\d.]+) LUFS/.exec(analisis.includes("Summary:") ? resumen : "");

  return {
    ancho: dim ? num(dim[1]) : 0,
    alto: dim ? num(dim[2]) : 0,
    duracion: Math.round(duracion * 1000) / 1000,
    tieneAudio,
    lufs: tieneAudio && lufs ? num(lufs[1]) : null,
    negros,
    congelados,
    silencios
  };
}
