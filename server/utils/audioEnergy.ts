/**
 * Curva de energía del audio para elegir highlights.
 *
 * Hasta ahora la IA escogía los momentos leyendo la transcripción y el título. En un bolo
 * instrumental —que es la mitad del material de una banda— no hay transcripción, así que
 * estaba adivinando. Medir el volumen real del audio da los subidones de verdad: dónde entra
 * la banda entera, dónde revienta el estribillo, dónde aplaude el público.
 *
 * Todo lo de este fichero es puro salvo `analizarEnergiaAudio`, que llama a ffmpeg.
 */

import fs from "fs";
import path from "path";
import os from "os";
import ffmpegStatic from "ffmpeg-static";
import { ejecutar } from "./youtubeSource.js";

/** Suelo en dB. astats devuelve `-inf` en el silencio absoluto y eso rompe cualquier media. */
export const DB_SILENCIO = -90;

export interface PuntoEnergia {
  /** Segundo del vídeo. */
  t: number;
  /** Nivel RMS en dB (negativo; 0 sería el máximo). */
  db: number;
}

export interface VentanaEnergia {
  start: number;
  end: number;
  /** Media de dB en la ventana. */
  db: number;
  /** 0-100 relativo al resto del vídeo, que es lo que entiende bien el modelo. */
  score: number;
}

/**
 * Lee la salida de `ametadata=print` de ffmpeg.
 *
 * Viene en pares de líneas:
 *   frame:12   pts:96000   pts_time:12
 *   lavfi.astats.Overall.RMS_level=-21.093191
 */
export function parseRmsCurve(salida?: string | null): PuntoEnergia[] {
  if (!salida) return [];
  const puntos: PuntoEnergia[] = [];
  let tActual: number | null = null;

  for (const linea of String(salida).split(/\r?\n/)) {
    const mTiempo = linea.match(/pts_time:([0-9]+(?:\.[0-9]+)?)/);
    if (mTiempo) {
      const t = parseFloat(mTiempo[1]);
      tActual = Number.isFinite(t) ? t : null;
      continue;
    }
    const mRms = linea.match(/RMS_level=(-?[0-9]+(?:\.[0-9]+)?|-?inf|nan)/i);
    if (mRms && tActual !== null) {
      const bruto = mRms[1].toLowerCase();
      let db: number;
      if (bruto === "-inf" || bruto === "inf" || bruto === "nan") db = DB_SILENCIO;
      else {
        const v = parseFloat(bruto);
        db = Number.isFinite(v) ? Math.max(DB_SILENCIO, v) : DB_SILENCIO;
      }
      puntos.push({ t: Math.round(tActual), db });
      tActual = null;
    }
  }
  return puntos;
}

/**
 * Ventanas de `duracion` segundos ordenadas por energía media, sin solaparse.
 *
 * Responde justo a la pregunta que importa: "¿dónde están los 30 segundos con más caña?".
 */
export function ventanasConMasEnergia(
  curva: PuntoEnergia[],
  opciones: { duracion: number; maxVentanas?: number; separacionMinima?: number }
): VentanaEnergia[] {
  const dur = Math.max(3, Math.floor(opciones.duracion || 30));
  const maxVentanas = Math.max(1, opciones.maxVentanas ?? 6);
  if (!Array.isArray(curva) || curva.length < 2) return [];

  const ordenada = [...curva].sort((a, b) => a.t - b.t);
  const ultimo = ordenada[ordenada.length - 1].t;
  if (ultimo < dur) return [];

  // Media móvil sobre la ventana, avanzando de segundo en segundo.
  const candidatas: VentanaEnergia[] = [];
  let i = 0;
  for (let inicio = 0; inicio + dur <= ultimo + 1; inicio++) {
    while (i < ordenada.length && ordenada[i].t < inicio) i++;
    let suma = 0;
    let n = 0;
    for (let j = i; j < ordenada.length && ordenada[j].t < inicio + dur; j++) {
      suma += ordenada[j].db;
      n++;
    }
    if (n === 0) continue;
    candidatas.push({ start: inicio, end: inicio + dur, db: suma / n, score: 0 });
  }
  if (!candidatas.length) return [];

  // Normalizamos a 0-100 contra el propio vídeo: lo que importa es el contraste interno,
  // no los dB absolutos (una grabación de móvil y una de mesa no son comparables).
  const dbs = candidatas.map((c) => c.db);
  const min = Math.min(...dbs);
  const max = Math.max(...dbs);
  const rango = max - min;
  for (const c of candidatas) {
    c.score = rango < 0.5 ? 50 : Math.round(((c.db - min) / rango) * 100);
  }

  const separacion = opciones.separacionMinima ?? Math.floor(dur / 2);
  const elegidas: VentanaEnergia[] = [];
  for (const c of [...candidatas].sort((a, b) => b.db - a.db)) {
    const chocaConOtra = elegidas.some((e) => c.start < e.end + separacion && e.start < c.end + separacion);
    if (chocaConOtra) continue;
    elegidas.push(c);
    if (elegidas.length >= maxVentanas) break;
  }
  return elegidas.sort((a, b) => a.start - b.start);
}

/**
 * Cuánto varía la energía DENTRO de un único tema (partes lentas y rápidas del mismo tema),
 * en vez de comparar entre temas distintos como hace `ventanasConMasEnergia`.
 *
 * Se normaliza igual que ahí (0-100 relativo al propio tema, nunca dB absolutos) y se mide
 * la desviación típica de esa serie: un tema plano da ~0, uno con contrastes reales de
 * verdad (una balada que revienta en el estribillo) da varios puntos sobre 10.
 */
export function medirVariacionInterna(curva: PuntoEnergia[]): number {
  if (!Array.isArray(curva) || curva.length < 2) return 0;

  const dbs = curva.map((c) => c.db);
  const min = Math.min(...dbs);
  const max = Math.max(...dbs);
  const rango = max - min;
  const normalizados = rango < 0.5 ? dbs.map(() => 50) : dbs.map((d) => ((d - min) / rango) * 100);

  const media = normalizados.reduce((a, b) => a + b, 0) / normalizados.length;
  const varianza = normalizados.reduce((a, b) => a + (b - media) ** 2, 0) / normalizados.length;
  const stdDev = Math.sqrt(varianza);

  return Math.max(0, Math.min(10, stdDev / 5));
}

function mmss(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Texto compacto para el prompt. Se le dan al modelo las ventanas candidatas, no la curva
 * entera: 2.400 números de un bolo de 40 minutos solo gastarían contexto.
 */
export function resumirEnergiaParaPrompt(ventanas: VentanaEnergia[]): string {
  if (!ventanas.length) return "";
  const lineas = ventanas.map(
    (v) => `- ${mmss(v.start)}-${mmss(v.end)} (energía ${v.score}/100)`
  );
  return [
    "TRAMOS CON MÁS ENERGÍA SONORA MEDIDA EN EL AUDIO REAL (no es una suposición, es el volumen medido):",
    ...lineas,
    "Úsalos como principal pista para elegir los cortes: un 100 es donde más suena la banda. Puedes apartarte de ellos si la transcripción o los capítulos apuntan a algo mejor, pero justifícalo."
  ].join("\n");
}

/**
 * Mide la energía del audio con ffmpeg. Acepta una ruta local o una URL directa de audio.
 *
 * `asetnsamples` fuerza frames de exactamente un segundo, que es lo que hace que `reset=1`
 * dé una medición por segundo: `reset` cuenta frames, no tiempo, y sin esto una hora de bolo
 * salían decenas de miles de líneas de 23 ms.
 *
 * Para una `fuente` remota, se descarga primero a un fichero temporal en vez de pasarle la URL
 * directamente a `-i`: el ffmpeg-static empaquetado aquí crashea (segfault, verificado a mano)
 * leyendo ciertas URLs https de storage en streaming — el mismo motivo por el que
 * `getAudioSnippetPath` (server/routes/concert_to_album.ts) ya hace fetch+fichero temporal en
 * vez de darle la URL cruda a ffmpeg. Sin esto, el análisis fallaba en TODAS las canciones con
 * audio remoto y el catch de abajo lo tragaba en silencio, guardando variación=0 como si el
 * análisis hubiera ido bien.
 *
 * Nunca lanza: si no se puede medir, se devuelve una curva vacía y el análisis sigue con la
 * transcripción como antes.
 */
export async function analizarEnergiaAudio(
  fuente: string,
  opciones: { timeoutMs?: number; maxDuracion?: number } = {}
): Promise<PuntoEnergia[]> {
  const binario = ffmpegStatic as unknown as string;
  if (!binario || !fuente) return [];

  let rutaLocal = fuente;
  let ficheroTemporal: string | null = null;
  if (/^https?:\/\//i.test(fuente)) {
    try {
      const resp = await fetch(fuente);
      if (!resp.ok) {
        console.error(`[Audio] No se pudo descargar el audio (HTTP ${resp.status}): ${fuente}`);
        return [];
      }
      const buffer = Buffer.from(await resp.arrayBuffer());
      ficheroTemporal = path.join(os.tmpdir(), `energia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.audio`);
      fs.writeFileSync(ficheroTemporal, buffer);
      rutaLocal = ficheroTemporal;
    } catch (err: any) {
      console.error("[Audio] No se pudo descargar el audio para analizarlo:", String(err?.message || err).substring(0, 200));
      return [];
    }
  }

  const args: string[] = ["-hide_banner", "-nostdin"];
  if (opciones.maxDuracion && opciones.maxDuracion > 0) {
    args.push("-t", String(Math.floor(opciones.maxDuracion)));
  }
  args.push(
    "-i", rutaLocal,
    "-vn",
    "-af", "aresample=8000,asetnsamples=n=8000:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
    "-f", "null",
    "-"
  );

  try {
    const { stdout } = await ejecutar(binario, args, {
      timeout: opciones.timeoutMs ?? 120_000,
      maxBuffer: 64 * 1024 * 1024
    });
    return parseRmsCurve(stdout);
  } catch (err: any) {
    console.error("[Audio] No se pudo medir la energía del audio:", String(err?.message || err).substring(0, 200));
    return [];
  } finally {
    if (ficheroTemporal) {
      fs.unlink(ficheroTemporal, () => {});
    }
  }
}
