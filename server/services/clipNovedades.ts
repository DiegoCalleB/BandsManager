/**
 * Pasos de /cut-video-clip que salieron del render clásico: análisis del tramo (loop y pulsos),
 * rótulo de enganche, control de calidad, guardado permanente y registro de procedencia (derechos)
 * del clip. Cada uno es best-effort salvo que se indique.
 */
import fs from "fs";
import { analizarEnergiaAudio } from "../utils/audioEnergy.js";
import { elegirDuracionDeLoop } from "../utils/loopPerfecto.js";
import { extraerPcmMono, detectarOnsetsDesdePcm, detectarBpmDesdeOnsets, SAMPLE_RATE } from "../utils/audioKey.js";
import { rejillaDeBeats, ajustarAlBeat } from "../utils/rejillaBeats.js";
import { loopViable } from "../utils/clipFiltros.js";
import { buildHookAss } from "../utils/hookRotulo.js";
import { derechosDelClip } from "../utils/derechosClip.js";
import { dbRegistrarReelClip } from "../db/reelClips.js";
import { uploadToSupabaseIfAvailable, rutaAlmacenamientoClip } from "../utils/storage.js";
import { controlarCalidadClip } from "./controlCalidad.js";
import { borrarSiExiste } from "./clipArchivos.js";
import type { ExpectativasClip, InformeCalidad } from "../utils/controlCalidadClip.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

/** La descarga de un tramo trae este margen (s) de más por cada lado (`tramoDeDescarga`). */
const MARGEN_DESCARGA_SEG = 2;

export interface AnalisisTramo {
  /** Duración final del clip: la pedida, o la que mejor cierra el loop (encajada en un pulso). */
  duracionClip: number;
  /** Compases reales (segundos del clip) para el golpe de luz del beat-drop. */
  golpes: number[];
}

/**
 * Lo que hay que saber del audio del tramo antes de renderizar. Best-effort: si no se puede medir,
 * se renderiza con la duración pedida y sin flash, nunca se bloquea el render.
 *  - Loop: final elegido por volumen (`elegirDuracionDeLoop`) y encajado en el pulso más cercano.
 *  - Beat-drop: compases reales a partir de los onsets y el BPM de `audioKey.ts`.
 */
export async function analizarTramo(
  rutaVideo: string,
  inicioEnFichero: number,
  duracion: number,
  quiero: { loop: boolean; beats: boolean }
): Promise<AnalisisTramo> {
  const loop = quiero.loop && loopViable(duracion);
  if (!loop && !quiero.beats) return { duracionClip: duracion, golpes: [] };
  const finDisponible = inicioEnFichero + duracion + MARGEN_DESCARGA_SEG;

  const [curva, pcm] = await Promise.all([
    loop ? analizarEnergiaAudio(rutaVideo, { timeoutMs: 60_000 }) : Promise.resolve([]),
    extraerPcmMono(rutaVideo, { timeoutMs: 60_000, maxDuracionSeg: Math.ceil(finDisponible) + 1 })
  ]);
  const onsets = pcm ? detectarOnsetsDesdePcm(pcm, SAMPLE_RATE) : [];
  const bpm = detectarBpmDesdeOnsets(onsets);
  const pulsos = rejillaDeBeats(onsets, bpm, inicioEnFichero, finDisponible).pulsos;

  let duracionClip = duracion;
  if (loop) {
    const porVolumen = elegirDuracionDeLoop(curva, { inicio: inicioEnFichero, duracion, finDisponible });
    const enPulso = ajustarAlBeat(porVolumen, pulsos);
    duracionClip = loopViable(enPulso) && inicioEnFichero + enPulso <= finDisponible ? enPulso : porVolumen;
  }
  const golpes = quiero.beats ? pulsos.filter((_, i) => i % 4 === 0).filter((t) => t < duracionClip) : [];
  return { duracionClip, golpes };
}

/** Escribe el rótulo de enganche como ASS. Devuelve la ruta, o undefined si no hay texto que poner. */
export async function escribirRotuloHook(ruta: string, texto: unknown, duracionClip: number): Promise<string | undefined> {
  const ass = buildHookAss(String(texto || ""), { duracion: duracionClip });
  if (!ass) return undefined;
  await fs.promises.writeFile(ruta, ass, "utf-8");
  return ruta;
}

export interface ProcedenciaClip {
  sourceUrl: string;
  canalOrigen: string;
  youtubeDeLaBanda: string;
  nombreDeLaBanda: string;
  declaradoPorLaBanda: boolean;
  loopPerfecto: boolean;
  hookText: string;
  duracionSeg: number;
}

export interface ClipGuardado {
  /** URL permanente de Supabase Storage o, si la subida falla, la del disco local (efímera). */
  clipUrl: string;
  guardadoPermanente: boolean;
  derechos: string | null;
  /** null = no se pudo medir. */
  calidad: InformeCalidad | null;
}

/**
 * Cierra un render: mide su calidad (sobre el fichero local, antes de que la subida lo borre),
 * lo sube a Supabase Storage y registra procedencia, derechos y calidad. Es lo que mira el
 * publicador antes de autopublicar.
 *
 * Solo un clip guardado de forma permanente se registra: public/clips/ vive en el disco efímero de
 * Railway y una URL local no la puede descargar Instagram. Si la subida falla, el clip se sigue
 * sirviendo desde disco exactamente como antes; solo no sobrevivirá a un redeploy.
 */
export async function guardarClipRenderizado(p: {
  bandId: string;
  rutaLocal: string;
  nombreFichero: string;
  esperado: ExpectativasClip;
  procedencia: ProcedenciaClip;
}): Promise<ClipGuardado> {
  const calidad = await controlarCalidadClip(p.rutaLocal, p.esperado);

  let clipUrl = `/clips/${p.nombreFichero}`;
  let guardadoPermanente = false;
  try {
    const urlPermanente = await uploadToSupabaseIfAvailable(p.rutaLocal, rutaAlmacenamientoClip(p.bandId, p.nombreFichero), "video/mp4");
    if (urlPermanente) {
      clipUrl = urlPermanente;
      guardadoPermanente = true;
      // Subido con éxito: se libera el disco ya mismo en vez de esperar a la barrida periódica.
      await borrarSiExiste([p.rutaLocal]);
    }
  } catch (e) {
    console.warn("[Reels] No se pudo subir el clip a Supabase Storage:", comoErrorCapturado(e).message || e);
  }

  const derechos = guardadoPermanente ? await registrarProcedenciaClip(p.bandId, clipUrl, p.procedencia, calidad) : null;
  return { clipUrl, guardadoPermanente, derechos, calidad };
}

/** Si falla el registro, el clip sigue siendo válido: solo se podrá publicar a mano. */
async function registrarProcedenciaClip(bandId: string, clipUrl: string, p: ProcedenciaClip, calidad: InformeCalidad | null): Promise<string | null> {
  const derechos = derechosDelClip({
    canalOrigen: p.canalOrigen,
    youtubeDeLaBanda: p.youtubeDeLaBanda,
    nombreDeLaBanda: p.nombreDeLaBanda,
    declaradoPorLaBanda: p.declaradoPorLaBanda
  });
  try {
    await dbRegistrarReelClip(
      {
        clip_url: clipUrl,
        source_url: p.sourceUrl,
        source_author: p.canalOrigen,
        source_author_url: "",
        derechos,
        loop_perfecto: p.loopPerfecto,
        hook_text: p.hookText,
        control_calidad: calidad,
        duracion_seg: p.duracionSeg
      },
      bandId
    );
  } catch (e) {
    console.warn("[Reels] No se pudo registrar la procedencia del clip:", comoErrorCapturado(e).message || e);
  }
  return derechos;
}
