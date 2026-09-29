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
  /** Instante del vídeo, en segundos (fraccional: ~10 muestras/segundo). */
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
      // Sin redondear: la detección de BPM necesita el instante real (fraccional) para
      // medir intervalos entre golpes de menos de un segundo. Ver comentario en
      // `analizarEnergiaAudio` sobre por qué el muestreo ya no es de 1/segundo.
      puntos.push({ t: tActual, db });
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

/**
 * Calcula el volumen promedio (dB crudo) de un audio, filtrado de silencio.
 *
 * Devuelve el valor RMS medio en escala dB absoluta (negativo). Este valor se guarda
 * en `energia_db_promedio` y luego se normaliza relativo a otras canciones de la banda
 * por `recalibrarEnergiasDelRepertorio` para obtener la energía 1-20 final.
 *
 * No mapea a ninguna escala — eso ocurre después a nivel de banda.
 */
export function calcularVolumenPromedioAudio(curva: PuntoEnergia[]): number | null {
  if (!Array.isArray(curva) || curva.length === 0) return null;

  const rmsValues = curva
    .map((p) => p.db)
    .filter((db) => db > DB_SILENCIO + 10); // -80 dB threshold: descarta silencio absoluto

  if (rmsValues.length === 0) return null; // todo silencio

  return rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
}

/**
 * Calcula la energía global (1-20) combinando tres señales del audio real, cada una normalizada
 * relativa al resto de la banda a partes iguales:
 *  - tempo (BPM detectado): más rápido, más energía.
 *  - densidad rítmica (onsets/segundo, de analizarAudioConIris en audioKey.ts): cuántos ataques
 *    por segundo tiene el tema — independiente del volumen de la mezcla. Dos temas al mismo BPM
 *    pueden sonar muy distinto de "cañeros" según lo densa que sea la base rítmica.
 *  - volumen medio (dB): sigue siendo una señal real, pero antes era la MITAD del cálculo (solo
 *    BPM+volumen) — con eso, un tema lento pero grabado/masterizado más alto podía puntuar más
 *    "energético" que uno rápido y denso grabado más flojo. A un tercio, el sesgo de
 *    masterización pesa menos frente a las otras dos señales.
 *
 * Se usa cuando se recalibra el repertorio: lee bpm, densidad de onsets y db_promedio de todas
 * las canciones, normaliza cada uno en su rango de banda, y promedia para la energía final.
 */
export function calcularEnergiaMultifactor(bpmDetectado: number, dbPromedio: number, onsetDensity: number, bandStats: {
  minBpm: number;
  maxBpm: number;
  minDb: number;
  maxDb: number;
  minOnsetDensity: number;
  maxOnsetDensity: number;
}): number {
  const bpmRango = bandStats.maxBpm - bandStats.minBpm;
  const dbRango = bandStats.maxDb - bandStats.minDb;
  const onsetRango = bandStats.maxOnsetDensity - bandStats.minOnsetDensity;

  // Si las tres señales son casi idénticas en toda la banda, diferenciar sería ruido de
  // redondeo, no una lectura real de qué tema suena más "cañero" que otro.
  if (bpmRango < 5 && dbRango < 1 && onsetRango < 0.15) {
    return 10;
  }

  const normalizar = (valor: number, min: number, rango: number, rangoMinimoUtil: number): number => {
    if (rango <= rangoMinimoUtil) return 5; // default si apenas hay variedad en esta señal
    return Math.max(0, Math.min(10, ((valor - min) / rango) * 10));
  };

  const bpmNorm = normalizar(bpmDetectado, bandStats.minBpm, bpmRango, 5);
  const dbNorm = normalizar(dbPromedio, bandStats.minDb, dbRango, 0.5);
  const onsetNorm = normalizar(onsetDensity, bandStats.minOnsetDensity, onsetRango, 0.15);

  // Promediar los tres factores y mapear a 1-20
  const promedio = (bpmNorm + dbNorm + onsetNorm) / 3; // 0-10
  const energia = Math.round(1 + (promedio / 10) * 19);

  return Math.max(1, Math.min(20, energia));
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
 * `asetnsamples` fuerza el tamaño de frame — sin esto, astats usa el frame nativo del
 * decodificador (~23ms, variable) y `reset=1` (que cuenta frames, no tiempo) da una
 * frecuencia irregular. Frames de 100ms (n=800 a 8kHz) dan ~10 mediciones/segundo: de sobra
 * para elegir qué ventana de 30s suena más fuerte (`ventanasConMasEnergia`) o medir contraste
 * interno (`medirVariacionInterna`), que es todo lo que esta curva alimenta ahora. El BPM ya
 * NO sale de aquí: 100ms de resolución cuantiza cualquier intervalo entre golpes a un múltiplo
 * de 0.1s, así que sobre audio real (no un pulso sintético perfecto) el tempo detectado
 * colapsaba en un puñado de valores en vez de reflejar el tempo real — ver `analizarAudioConIris`
 * en audioKey.ts, que mide onsets por flujo espectral sobre el PCM real (~23ms de resolución).
 *
 * Para una `fuente` remota, ver `resolverFuenteAudioLocal` (descarga a temporal primero: el
 * ffmpeg-static empaquetado aquí crashea leyendo ciertas URLs https en streaming). Sin esto, el
 * análisis fallaba en TODAS las canciones con audio remoto y el catch de abajo lo tragaba en
 * silencio, guardando variación=0 como si el análisis hubiera ido bien.
 *
 * Nunca lanza: si no se puede medir, se devuelve una curva vacía y el análisis sigue con la
 * transcripción como antes.
 */
/**
 * Resuelve una fuente de audio (URL remota o ruta local) a un fichero local que ffmpeg pueda
 * leer de forma fiable, descargándola a un temporal si hace falta.
 *
 * Se descarga primero a un fichero temporal en vez de pasarle la URL directamente a `-i`: el
 * ffmpeg-static empaquetado aquí crashea (segfault, verificado a mano) leyendo ciertas URLs
 * https de storage en streaming — el mismo motivo por el que `getAudioSnippetPath`
 * (server/routes/concert_to_album.ts) ya hace fetch+fichero temporal en vez de darle la URL
 * cruda a ffmpeg.
 *
 * Devuelve `null` si la descarga falla. Quien llame debe invocar `limpiar()` cuando termine
 * (borra el temporal si se creó uno; no hace nada si la fuente ya era un fichero local).
 */
export async function resolverFuenteAudioLocal(
  fuente: string
): Promise<{ ruta: string; limpiar: () => void } | null> {
  if (!fuente) return null;

  // blob:/data:/indexeddb: son URLs que solo existen en la memoria del navegador que las creó
  // (el objeto vive en esa pestaña concreta) — no un fichero real en ESTE servidor ni una URL
  // remota descargable. Sin este chequeo caían en la rama de "es una ruta local" de abajo y se
  // le pasaban tal cual a ffmpeg, que fallaba con un críptico "Protocol not found" en vez de un
  // motivo claro. Esto no tiene arreglo aquí: la canción tiene que resubirse desde el cliente a
  // almacenamiento permanente (Supabase) para que el servidor pueda llegar a su audio.
  if (/^(blob|data|indexeddb):/i.test(fuente)) {
    console.error(`[Audio] URL de audio no accesible desde el servidor (${fuente.split(':')[0]}: es local del navegador, no un fichero real): ${fuente.slice(0, 80)}…`);
    return null;
  }

  if (!/^https?:\/\//i.test(fuente)) {
    if (fs.existsSync(fuente)) {
      return { ruta: fuente, limpiar: () => {} };
    }

    // Si es una ruta web pública o relativa (ej. /audio/samples/..., /clips/..., /uploads/...)
    const cleanRelative = fuente.replace(/^\/+/, "");
    const candidatos = [
      path.join(process.cwd(), "public", cleanRelative),
      path.join(process.cwd(), cleanRelative),
      path.join(process.cwd(), "dist", cleanRelative),
      path.resolve(process.cwd(), "public", cleanRelative),
      path.resolve(process.cwd(), "dist", cleanRelative)
    ];
    for (const candidato of candidatos) {
      if (fs.existsSync(candidato)) {
        return { ruta: candidato, limpiar: () => {} };
      }
    }

    return { ruta: fuente, limpiar: () => {} };
  }

  try {
    const resp = await fetch(fuente);
    if (!resp.ok) {
      console.error(`[Audio] No se pudo descargar el audio (HTTP ${resp.status}): ${fuente}`);
      return null;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    const ficheroTemporal = path.join(os.tmpdir(), `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.audio`);
    fs.writeFileSync(ficheroTemporal, buffer);
    return { ruta: ficheroTemporal, limpiar: () => fs.unlink(ficheroTemporal, () => {}) };
  } catch (err: any) {
    console.error("[Audio] No se pudo descargar el audio para analizarlo:", String(err?.message || err).substring(0, 200));
    return null;
  }
}

export async function analizarEnergiaAudio(
  fuente: string,
  opciones: { timeoutMs?: number; maxDuracion?: number } = {}
): Promise<PuntoEnergia[]> {
  const binario = ffmpegStatic as unknown as string;
  if (!binario || !fuente) return [];

  const resuelto = await resolverFuenteAudioLocal(fuente);
  if (!resuelto) return [];
  const { ruta: rutaLocal, limpiar: limpiarTemporal } = resuelto;

  const args: string[] = ["-hide_banner", "-nostdin"];
  if (opciones.maxDuracion && opciones.maxDuracion > 0) {
    args.push("-t", String(Math.floor(opciones.maxDuracion)));
  }
  args.push(
    "-i", rutaLocal,
    "-vn",
    "-af", "aresample=8000,asetnsamples=n=800:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
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
    limpiarTemporal();
  }
}

/**
 * Configuración de preprocesamiento para grabaciones de directo.
 */
export interface OpcionesPreprocesamientoDirecto {
  /** Eliminar ruidos subsónicos por debajo de 35Hz (viento, golpes de soporte de micro) */
  filtroRumble?: boolean;
  /** Normalización de sonoridad estándar broadcast (EBU R128 / LUFS integrado objetivo) */
  targetLufs?: number;
  /** Techo máximo de picos True-Peak en dBFS para evitar distorsión en clipping */
  truePeakDb?: number;
  /** Rango dinámico LRA objetivo para comprimir suavemente picos sin aplastar la dinámica */
  lraTarget?: number;
  /** Atenuación suave de frecuencias hirientes / siseos de directo (>15kHz) */
  deHiss?: boolean;
}

/**
 * Construye la cadena de filtros de audio FFmpeg para acondicionar grabaciones de directo
 * antes de la separación de stems, análisis espectral o masterización de conciertos.
 *
 * Incluye:
 * - Filtro subsónico paso alto (35Hz) para limpiar acoples de escenario y golpes de soporte.
 * - Filtro paso bajo suave anti-hiss (15.5kHz).
 * - Loudnorm de doble pasada o EBU R128 (-14 LUFS para streaming/ensayo, -16 LUFS para conciertos).
 */
export function construirFiltroPreprocesamientoDirecto(opciones: OpcionesPreprocesamientoDirecto = {}): string {
  const {
    filtroRumble = true,
    targetLufs = -14,
    truePeakDb = -1.0,
    lraTarget = 11,
    deHiss = true
  } = opciones;

  const filtros: string[] = [];

  // 1. Limpieza de rumble de escenario y frecuencias no musicales
  if (filtroRumble) {
    filtros.push("highpass=f=35:poles=2");
  }

  // 2. Control de agudos extremos y siseo de sala
  if (deHiss) {
    filtros.push("lowpass=f=15500:poles=2");
  }

  // 3. Normalización EBU R128 profesional (Loudnorm)
  const clampedLufs = Math.max(-24, Math.min(-9, targetLufs));
  const clampedPeak = Math.max(-6, Math.min(-0.1, truePeakDb));
  const clampedLra = Math.max(5, Math.min(20, lraTarget));

  filtros.push(`loudnorm=I=${clampedLufs}:TP=${clampedPeak}:LRA=${clampedLra}`);

  return filtros.join(",");
}

/**
 * Acondiciona y normaliza un archivo de audio de concierto/directo usando FFmpeg.
 * Produce un archivo de alta fidelidad listo para inferencia de stems o corte de pistas.
 */
export async function preprocesarAudioDirecto(
  rutaEntrada: string,
  rutaSalida: string,
  opciones: OpcionesPreprocesamientoDirecto = {}
): Promise<{ success: boolean; rutaSalida: string; error?: string }> {
  const binario = ffmpegStatic as unknown as string;
  if (!binario) {
    return { success: false, rutaSalida: rutaEntrada, error: "ffmpeg no disponible" };
  }

  const cadenaFiltro = construirFiltroPreprocesamientoDirecto(opciones);
  const args = [
    "-y",
    "-hide_banner",
    "-nostdin",
    "-i", rutaEntrada,
    "-af", cadenaFiltro,
    "-c:a", "libmp3lame",
    "-b:a", "320k",
    "-ar", "44100",
    rutaSalida
  ];

  try {
    await ejecutar(binario, args, { timeout: 180_000 });
    if (fs.existsSync(rutaSalida) && fs.statSync(rutaSalida).size > 0) {
      return { success: true, rutaSalida };
    }
    return { success: false, rutaSalida: rutaEntrada, error: "Archivo de salida vacío tras preprocesado" };
  } catch (err: any) {
    console.error("[Preprocesado Audio Directo] Fallo en ffmpeg:", err?.message || err);
    return { success: false, rutaSalida: rutaEntrada, error: String(err?.message || err) };
  }
}
