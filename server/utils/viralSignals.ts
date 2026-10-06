// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Detección de los fragmentos con más potencial viral.
 *
 * Medir solo el volumen (audioEnergy.ts) encuentra "dónde suena fuerte", que NO es lo mismo
 * que "dónde engancha". En un concierto entero a todo trapo, el volumen es alto de principio
 * a fin y no distingue nada. Lo que engancha en un Reel es:
 *
 *   - el CONTRASTE: el silencio justo antes del subidón, la entrada de la banda al completo;
 *   - el ARRANQUE: que los 2 primeros segundos del corte ya suban, porque son los que deciden
 *     si alguien sigue mirando o pasa de largo;
 *   - el RITMO VISUAL: cuántos cambios de plano hay, que en un videoclip pesa tanto como el audio.
 *
 * Así que aquí se combinan tres señales medidas de verdad (no estimadas por la IA) y se pesan
 * distinto según el tipo de contenido: en un concierto manda la energía, en un videoclip manda
 * el montaje.
 *
 * Lo único impuro es `detectarCambiosDePlano`, que llama a ffmpeg.
 */

import ffmpegStatic from "ffmpeg-static";
import { ejecutar } from "./youtubeSource.js";
import { DB_SILENCIO, type PuntoEnergia } from "./audioEnergy.js";

/** Cómo está grabado el material, que cambia por completo qué hace viral a un fragmento. */
export type TipoContenido = "concierto" | "videoclip" | "ensayo" | "otro";

export const TIPOS_CONTENIDO: TipoContenido[] = ["concierto", "videoclip", "ensayo", "otro"];

export function esTipoContenido(v: unknown): v is TipoContenido {
  return typeof v === "string" && (TIPOS_CONTENIDO as string[]).includes(v);
}

/**
 * Adivina el tipo a partir del título y la descripción del vídeo. Es solo el valor por
 * defecto: el usuario puede cambiarlo en la interfaz, y su elección siempre manda.
 */
export function detectarTipoContenido(titulo?: string, descripcion?: string): TipoContenido {
  const texto = `${titulo || ""} ${descripcion || ""}`.toLowerCase();
  if (!texto.trim()) return "otro";

  // El orden importa: "videoclip oficial grabado en directo" es un videoclip, no un concierto.
  if (/\b(videoclip|video ?clip|official video|v[íi]deo oficial|video oficial|lyric video)\b/.test(texto)) {
    return "videoclip";
  }
  if (/\b(directo|en vivo|live|concierto|concert|gig|bolo|festival|sala|gira|tour)\b/.test(texto)) {
    return "concierto";
  }
  if (/\b(ensayo|rehearsal|local de ensayo|maqueta|jam|prueba de sonido|soundcheck|backstage)\b/.test(texto)) {
    return "ensayo";
  }
  return "otro";
}

/* --------------------------------------------------------- señal visual */

/**
 * Instantes (en segundos) en los que cambia el plano. En un videoclip el ritmo de montaje es
 * casi tan determinante como la música; en un concierto grabado con una cámara fija saldrán
 * pocos, y por eso este peso baja en ese tipo de contenido.
 *
 * Nunca lanza: sin señal visual, la puntuación sigue funcionando solo con el audio.
 */
export async function detectarCambiosDePlano(
  fuente: string,
  opciones: { timeoutMs?: number; umbral?: number } = {}
): Promise<number[]> {
  const binario = ffmpegStatic as unknown as string;
  if (!binario || !fuente) return [];

  const umbral = opciones.umbral ?? 10;
  try {
    const { stdout } = await ejecutar(
      binario,
      [
        "-hide_banner", "-nostdin",
        "-i", fuente,
        "-an",
        // Bajamos resolución y frecuencia: para contar cortes no hace falta decodificar 1080p
        // a 50 fps, y así el análisis de un bolo largo no se eterniza.
        "-vf", `scale=320:-2,fps=10,scdet=threshold=${umbral},metadata=print:key=lavfi.scd.time:file=-`,
        "-f", "null", "-"
      ],
      { timeout: opciones.timeoutMs ?? 180_000, maxBuffer: 32 * 1024 * 1024 }
    );
    return parseCambiosDePlano(stdout);
  } catch (err: any) {
    console.log("[Señales] No se pudieron detectar los cambios de plano:", String(err?.message || err).substring(0, 200));
    return [];
  }
}

/** Lee los `lavfi.scd.time=N` que imprime ffmpeg, uno por cambio de plano detectado. */
export function parseCambiosDePlano(salida?: string | null): number[] {
  if (!salida) return [];
  const tiempos: number[] = [];
  for (const linea of String(salida).split(/\r?\n/)) {
    const m = linea.match(/lavfi\.scd\.time=([0-9]+(?:\.[0-9]+)?)/);
    if (!m) continue;
    const t = parseFloat(m[1]);
    if (Number.isFinite(t) && t >= 0) tiempos.push(Number(t.toFixed(2)));
  }
  return tiempos.sort((a, b) => a - b);
}

/* ------------------------------------------------------ puntuación viral */

export interface VentanaViral {
  start: number;
  end: number;
  /** 0-100: cuánto suena la banda en el tramo, relativo al resto del vídeo. */
  energia: number;
  /** 0-100: cuánto SUBE la energía al empezar el corte respecto a los segundos previos. */
  arranque: number;
  /** 0-100: densidad de cambios de plano, relativa al resto del vídeo. */
  dinamismo: number;
  /** 0-100: combinación pesada de las tres, según el tipo de contenido. */
  score: number;
  /** Por qué ha puntuado así, en texto, para el prompt y para la interfaz. */
  motivo: string;
}

const PESOS: Record<TipoContenido, { energia: number; arranque: number; dinamismo: number }> = {
  // En un bolo manda la energía y la reacción del público; la cámara suele moverse poco.
  concierto: { energia: 0.45, arranque: 0.35, dinamismo: 0.2 },
  // En un videoclip el montaje está trabajado y pesa tanto como el audio.
  videoclip: { energia: 0.3, arranque: 0.3, dinamismo: 0.4 },
  // Un ensayo casi nunca tiene montaje: puntuarlo por planos sería puro ruido.
  ensayo: { energia: 0.55, arranque: 0.35, dinamismo: 0.1 },
  otro: { energia: 0.4, arranque: 0.35, dinamismo: 0.25 }
};

function mediaEnRango(curva: PuntoEnergia[], desde: number, hasta: number): number | null {
  let suma = 0;
  let n = 0;
  for (const p of curva) {
    if (p.t >= desde && p.t < hasta) {
      suma += p.db;
      n++;
    }
  }
  return n > 0 ? suma / n : null;
}

function normalizar(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor)) return 0;
  const rango = max - min;
  if (rango < 0.001) return 50;
  return Math.max(0, Math.min(100, Math.round(((valor - min) / rango) * 100)));
}

export interface OpcionesViral {
  duracion: number;
  tipo?: TipoContenido;
  cambiosDePlano?: number[];
  maxVentanas?: number;
  separacionMinima?: number;
}

/**
 * Ventanas ordenadas por potencial viral, no por volumen bruto.
 *
 * La diferencia clave frente a `ventanasConMasEnergia`: aquí un tramo que ARRANCA subiendo
 * gana a uno que ya venía alto desde antes, porque en un Reel los dos primeros segundos son
 * los que deciden si alguien se queda.
 */
export function ventanasMasVirales(
  curva: PuntoEnergia[],
  opciones: OpcionesViral
): VentanaViral[] {
  const dur = Math.max(3, Math.floor(opciones.duracion || 30));
  const tipo: TipoContenido = opciones.tipo && esTipoContenido(opciones.tipo) ? opciones.tipo : "otro";
  const pesos = PESOS[tipo];
  const maxVentanas = Math.max(1, opciones.maxVentanas ?? 6);
  const cortes = Array.isArray(opciones.cambiosDePlano) ? opciones.cambiosDePlano : [];

  if (!Array.isArray(curva) || curva.length < 2) return [];
  const ordenada = [...curva].sort((a, b) => a.t - b.t);
  const ultimo = ordenada[ordenada.length - 1].t;
  if (ultimo < dur) return [];

  // Primera pasada: métricas crudas por ventana.
  interface Cruda {
    start: number;
    end: number;
    dbMedio: number;
    subida: number;
    cortesPorSeg: number;
  }
  const crudas: Cruda[] = [];
  // La "cabeza" del corte es lo que se ve en los primeros instantes: ahí es donde importa
  // que la energía suba respecto a lo que venía justo antes.
  const cabeza = Math.max(2, Math.round(dur * 0.25));
  const previo = Math.max(3, Math.round(dur * 0.4));

  for (let inicio = 0; inicio + dur <= ultimo + 1; inicio++) {
    const dbMedio = mediaEnRango(ordenada, inicio, inicio + dur);
    if (dbMedio === null) continue;

    const dbCabeza = mediaEnRango(ordenada, inicio, inicio + cabeza);
    const dbPrevio = inicio > 0 ? mediaEnRango(ordenada, Math.max(0, inicio - previo), inicio) : null;
    // Sin nada antes (el corte empieza en 0) no hay subida medible: se puntúa como neutra en
    // vez de como cero, porque empezar por el principio del vídeo no es malo de por sí.
    const subida = dbCabeza !== null && dbPrevio !== null ? dbCabeza - dbPrevio : 0;

    const cortesDentro = cortes.filter((t) => t >= inicio && t < inicio + dur).length;
    crudas.push({ start: inicio, end: inicio + dur, dbMedio, subida, cortesPorSeg: cortesDentro / dur });
  }
  if (!crudas.length) return [];

  // Normalizamos cada señal contra el propio vídeo: lo que importa es el contraste interno,
  // no los valores absolutos (una grabación de móvil y una de mesa no son comparables).
  const dbs = crudas.map((c) => c.dbMedio);
  const subidas = crudas.map((c) => c.subida);
  const densidades = crudas.map((c) => c.cortesPorSeg);
  const minDb = Math.min(...dbs);
  const maxDb = Math.max(...dbs);
  const minSub = Math.min(...subidas);
  const maxSub = Math.max(...subidas);
  const maxDens = Math.max(...densidades);

  const puntuadas: VentanaViral[] = crudas.map((c) => {
    const energia = normalizar(c.dbMedio, minDb, maxDb);
    const arranque = normalizar(c.subida, minSub, maxSub);
    // Sin cortes en todo el vídeo (cámara fija) el dinamismo no aporta nada: se deja neutro
    // para no penalizar a todos los tramos por igual, que sería ruido puro.
    const dinamismo = maxDens > 0 ? normalizar(c.cortesPorSeg, 0, maxDens) : 50;

    const score = Math.round(
      energia * pesos.energia + arranque * pesos.arranque + dinamismo * pesos.dinamismo
    );

    return { start: c.start, end: c.end, energia, arranque, dinamismo, score, motivo: "" };
  });

  // Nos quedamos con las mejores sin solaparse.
  const separacion = opciones.separacionMinima ?? Math.floor(dur / 2);
  const elegidas: VentanaViral[] = [];
  for (const v of [...puntuadas].sort((a, b) => b.score - a.score)) {
    const choca = elegidas.some((e) => v.start < e.end + separacion && e.start < v.end + separacion);
    if (choca) continue;
    elegidas.push({ ...v, motivo: describirVentana(v, cortes.length > 0) });
    if (elegidas.length >= maxVentanas) break;
  }
  return elegidas.sort((a, b) => a.start - b.start);
}

/** Explica en una frase por qué este tramo ha puntuado así. */
export function describirVentana(v: VentanaViral, haySenalVisual: boolean): string {
  const partes: string[] = [];
  if (v.arranque >= 70) partes.push("arranca subiendo de golpe (buen gancho para los 2 primeros segundos)");
  else if (v.arranque <= 25) partes.push("entra sin contraste, ya venía alto de antes");

  if (v.energia >= 75) partes.push("de los tramos donde más suena la banda");
  else if (v.energia <= 30) partes.push("tramo sonoramente flojo");

  if (haySenalVisual) {
    if (v.dinamismo >= 70) partes.push("montaje muy movido, con muchos cambios de plano");
    else if (v.dinamismo <= 25) partes.push("plano casi fijo");
  }

  return partes.length ? partes.join("; ") : "tramo sin nada especialmente destacable en las señales medidas";
}

function mmss(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Bloque para el prompt. Se le dan al modelo las ventanas candidatas con el desglose de por
 * qué puntúan, no la curva entera: así puede razonar sobre señales medidas en vez de adivinar.
 */
export function resumirSenalesParaPrompt(ventanas: VentanaViral[], tipo: TipoContenido): string {
  if (!ventanas.length) return "";

  const lineas = ventanas.map(
    (v) =>
      `- ${mmss(v.start)}-${mmss(v.end)} | potencial ${v.score}/100 ` +
      `(volumen ${v.energia}, arranque ${v.arranque}, ritmo visual ${v.dinamismo}) → ${v.motivo}`
  );

  const notaTipo =
    tipo === "concierto"
      ? "Es un CONCIERTO: prioriza los momentos de subidón y de reacción del público."
      : tipo === "videoclip"
        ? "Es un VIDEOCLIP: prioriza el estribillo y los tramos con montaje más trabajado."
        : tipo === "ensayo"
          ? "Es un ENSAYO: prioriza los momentos musicales potentes; el montaje aquí no dice nada."
          : "";

  return [
    "SEÑALES MEDIDAS EN EL VÍDEO REAL (no son suposiciones: son medidas sobre el audio y la imagen).",
    "'arranque' alto = la energía SUBE justo al empezar ese tramo, que es lo que frena el scroll.",
    ...lineas,
    notaTipo,
    "Usa esto como pista principal. Puedes apartarte si la transcripción o los capítulos apuntan a algo mejor, pero justifícalo en 'reason'."
  ]
    .filter(Boolean)
    .join("\n");
}
