/**
 * Plan de ffmpeg para un clip vertical: qué filtros y qué opciones de salida lleva.
 *
 * Es una función pura (no lanza ffmpeg) para poder probar la composición sin renderizar. El
 * orden importa: encuadre 9:16 → subtítulos → rótulo de enganche → loop. Subtítulos y rótulo se
 * queman ANTES del loop para que el cierre cruzado mezcle también lo que se ve en pantalla.
 */
import { buildVerticalFilter, escapeFilterPath, type CropMode, type VerticalFilterOptions } from "./reelsCore.js";
import { expresionFlash } from "./rejillaBeats.js";

/** Cuánto dura el cruce entre el final y el principio del bucle (s). */
export const FUNDIDO_LOOP_SEG = 0.4;
/** Un loop necesita cuerpo suficiente más el cruce: por debajo de esto no se aplica. */
export const MIN_DURACION_LOOP_SEG = 3;
/** Objetivo de sonoridad de Instagram/TikTok/Shorts: -14 LUFS integrados, pico real -1 dBTP. */
/** `xfade` exige frame rate constante (ffmpeg 7 lo rechaza tras un `trim`) y la salida de calidad alta ya es de 30 fps. */
const FPS = 30;
const LOUDNORM = "loudnorm=I=-14:TP=-1:LRA=11";

export interface OpcionesPlanClip extends VerticalFilterOptions {
  cropMode: CropMode;
  /** Duración real del clip en segundos (la necesita el loop para colocar el cruce). */
  duracion: number;
  rutaSubtitulos?: string;
  /** ASS con el rótulo de los 2 primeros segundos. */
  rutaHook?: string;
  normalizarVolumen?: boolean;
  /** Cierra el clip fundiendo su final con su principio para que al repetirse no se note el salto. */
  loop?: boolean;
  /**
   * Segundos del clip (compases reales) donde poner el golpe de luz del beat-drop. Sin golpes no
   * hay flash: el de `buildVerticalFilter` parpadeaba cada 4 s a ciegas y, sin `eval=frame`, en
   * realidad aclaraba el vídeo entero.
   */
  golpes?: number[];
  /** El fichero de origen no trae pista de audio: no se construye cadena de audio. */
  sinAudio?: boolean;
  /** Calidad de salida: `alta` para lo que se va a publicar; `rapida` conserva el comportamiento anterior. */
  calidad?: "alta" | "rapida";
}

export interface PlanFfmpeg {
  filtroComplejo: string[];
  mapas: string[];
  opcionesSalida: string[];
  /** Duración del fichero resultante (el loop recorta el cruce). */
  duracionFinal: number;
  loopAplicado: boolean;
}

export function loopViable(duracion: number): boolean {
  return duracion >= MIN_DURACION_LOOP_SEG + 2 * FUNDIDO_LOOP_SEG;
}

function opcionesDeCodificacion(calidad: "alta" | "rapida"): string[] {
  const comunes = ["-c:v libx264", "-pix_fmt yuv420p", "-c:a aac", "-movflags +faststart"];
  return calidad === "alta"
    ? // 30 fps constantes y un keyframe cada 2 s: lo que mejor sobrevive a la recompresión de las redes.
      [...comunes, "-preset medium", "-crf 19", "-r 30", "-g 60", "-b:a 192k", "-ar 48000"]
    : [...comunes, "-preset veryfast", "-crf 23", "-b:a 128k", "-ar 44100"];
}

/** Cadena de vídeo: encuadre + capas. Devuelve los filtros y la etiqueta de la última salida. */
function cadenaDeVideo(o: OpcionesPlanClip): { filtros: string[]; etiqueta: string } {
  const filtros = buildVerticalFilter(o.cropMode, 1080, 1920, {
    punchInZoom: Boolean(o.punchInZoom),
    beatDropFx: false, // ver `golpes`: el flash de buildVerticalFilter no está sincronizado ni animado
    smartPan: Boolean(o.smartPan)
  });
  let etiqueta = filtros.length ? "v" : "0:v";

  const flash = o.beatDropFx ? expresionFlash(o.golpes || []) : "";
  if (flash) {
    filtros.push(`[${etiqueta}]${flash}[vb]`);
    etiqueta = "vb";
  }

  // Ambas capas son ASS; `subtitles` las pinta igual. Se encadenan desde la salida del encuadre.
  const capa = (ruta: string, destino: string) => {
    filtros.push(`[${etiqueta}]subtitles='${escapeFilterPath(ruta)}'[${destino}]`);
    etiqueta = destino;
  };
  if (o.rutaSubtitulos) capa(o.rutaSubtitulos, "vs");
  if (o.rutaHook) capa(o.rutaHook, "vh");
  return { filtros, etiqueta };
}

export function planearRenderClip(o: OpcionesPlanClip): PlanFfmpeg {
  const { filtros, etiqueta } = cadenaDeVideo(o);
  const loop = Boolean(o.loop) && loopViable(o.duracion);
  const f = FUNDIDO_LOOP_SEG;
  const conAudio = !o.sinAudio;
  const tieneAudioFiltrado = conAudio && (Boolean(o.normalizarVolumen) || loop);
  const hayGrafo = filtros.length > 0 || tieneAudioFiltrado;
  const calidad = o.calidad ?? "rapida";

  if (!hayGrafo) {
    return { filtroComplejo: [], mapas: [], opcionesSalida: opcionesDeCodificacion(calidad), duracionFinal: o.duracion, loopAplicado: false };
  }

  // Vídeo hacia una etiqueta final [vout].
  const video = [...filtros];
  if (!filtros.length) video.push(`[0:v]null[v]`);
  const entradaVideo = filtros.length ? etiqueta : "v";

  let salidaVideo = entradaVideo;
  const audio: string[] = [];
  let entradaAudio = "0:a";

  if (conAudio && o.normalizarVolumen) {
    audio.push(`[0:a]${LOUDNORM}[an]`);
    entradaAudio = "an";
  }

  if (loop) {
    const d = o.duracion;
    // Cabeza (primeros f s) y cuerpo (el resto). El cuerpo termina fundiéndose con la cabeza, y
    // la cabeza acaba justo donde empieza el cuerpo: el último fotograma enlaza con el primero.
    video.push(
      `[${entradaVideo}]split=2[vh_a][vb_a]`,
      `[vh_a]trim=0:${f},setpts=PTS-STARTPTS,fps=${FPS}[vhead]`,
      `[vb_a]trim=${f}:${d},setpts=PTS-STARTPTS,fps=${FPS}[vbody]`,
      `[vbody][vhead]xfade=transition=fade:duration=${f}:offset=${(d - 2 * f).toFixed(3)}[vloop]`
    );
    salidaVideo = "vloop";
    // El audio cruza con fundidos en vez de `acrossfade`: con las dos entradas saliendo del
    // mismo `asplit`, `acrossfade` no emite nada (probado con ffmpeg 6.1). Salida del cuerpo +
    // entrada de la cabeza retrasada, sumadas, es el mismo cruce de potencia constante.
    if (conAudio) audio.push(
      `[${entradaAudio}]asplit=2[ah_a][ab_a]`,
      `[ah_a]atrim=0:${f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${f}:curve=qsin,adelay=${Math.round((d - 2 * f) * 1000)}:all=1[ahead]`,
      `[ab_a]atrim=${f}:${d},asetpts=PTS-STARTPTS,afade=t=out:st=${(d - 2 * f).toFixed(3)}:d=${f}:curve=qsin[abody]`,
      `[abody][ahead]amix=inputs=2:duration=longest:normalize=0,atrim=0:${(d - f).toFixed(3)}[aloop]`
    );
    if (conAudio) entradaAudio = "aloop";
  }

  const mapas = [`-map [${salidaVideo}]`];
  if (audio.length) mapas.push(`-map [${entradaAudio}]`);
  else if (conAudio) mapas.push("-map 0:a?");

  return {
    filtroComplejo: [...video, ...audio],
    mapas,
    opcionesSalida: opcionesDeCodificacion(calidad),
    duracionFinal: loop ? o.duracion - f : o.duracion,
    loopAplicado: loop
  };
}
