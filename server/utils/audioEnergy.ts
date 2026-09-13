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
 * Detecta el tempo (BPM) real del tema a partir de los golpes de energía en el audio.
 *
 * La versión anterior de esta función medía sobre una curva de 1 muestra/segundo y
 * confundía índices de array con tiempo real — con esos datos era imposible distinguir
 * un golpe de otro en cualquier tema por encima de 60 BPM (un tema a 120 BPM golpea cada
 * 0.5s, dos veces más rápido que la propia muestra), así que casi todas las canciones
 * caían en el valor por defecto. Con el muestreo ahora a ~10/segundo (ver
 * `analizarEnergiaAudio`) esto ya mide golpes de verdad, usando timestamps reales.
 *
 * Algoritmo: flujo de energía (subidas de RMS, que es donde ataca una nota) → picos
 * locales por encima de un umbral adaptativo → intervalos entre picos → moda del
 * histograma de esos intervalos (más robusto que la media/mediana ante síncopas) →
 * corrección de octava (doblar/partir por 2 si el tempo cae fuera del rango típico de
 * un cover de rock, el error de octava clásico de cualquier detector de tempo).
 *
 * Devuelve `null` (no un valor inventado) cuando no hay suficientes golpes para fiarse
 * del resultado — así `recalibrarEnergiasDelRepertorio` no deja que un "120" de relleno
 * contamine el rango real de la banda.
 */
export function detectarBpmDesdeAudio(curva: PuntoEnergia[]): number | null {
  if (!Array.isArray(curva) || curva.length < 8) return null;

  const ordenada = [...curva].sort((a, b) => a.t - b.t);
  const puntos = ordenada.filter((p) => p.db > DB_SILENCIO + 10); // descarta silencio
  if (puntos.length < 8) return null;

  const dbs = puntos.map((p) => p.db);
  const min = Math.min(...dbs);
  const max = Math.max(...dbs);
  const rango = max - min;
  if (rango < 1) return null; // audio demasiado uniforme, no hay ritmo que medir

  const normalizado = dbs.map((db) => (db - min) / rango);

  // Flujo de energía: solo subidas (los ataques de nota), igual que un onset detector
  // clásico de flujo espectral pero aplicado sobre RMS.
  const flujo: number[] = [0];
  for (let i = 1; i < normalizado.length; i++) {
    flujo.push(Math.max(0, normalizado[i] - normalizado[i - 1]));
  }

  const media = flujo.reduce((a, b) => a + b, 0) / flujo.length;
  const varianza = flujo.reduce((a, b) => a + (b - media) ** 2, 0) / flujo.length;
  const umbral = media + Math.sqrt(varianza) * 0.5;
  if (umbral <= 0) return null;

  // Picos locales del flujo, exigiendo 150ms de separación mínima (tope ~400 BPM,
  // de sobra para cualquier cover de rock) para no contar el mismo golpe dos veces.
  const SEPARACION_MINIMA = 0.15;
  const onsetTimes: number[] = [];
  let ultimoOnset = -Infinity;

  for (let i = 1; i < flujo.length - 1; i++) {
    const esPicoLocal = flujo[i] >= flujo[i - 1] && flujo[i] >= flujo[i + 1];
    if (esPicoLocal && flujo[i] > umbral && puntos[i].t - ultimoOnset >= SEPARACION_MINIMA) {
      onsetTimes.push(puntos[i].t);
      ultimoOnset = puntos[i].t;
    }
  }

  if (onsetTimes.length < 6) return null; // muy pocos golpes detectados para fiarse

  // Inter-onset intervals reales, en segundos (no índices de array).
  const iois: number[] = [];
  for (let i = 1; i < onsetTimes.length; i++) {
    const ioi = onsetTimes[i] - onsetTimes[i - 1];
    if (ioi >= 0.25 && ioi <= 1.5) iois.push(ioi); // 40-240 BPM
  }
  if (iois.length < 4) return null;

  // Moda del histograma de IOIs (bins de 30ms): el pulso real se repite más que
  // cualquier síncopa aislada, así que gana el bin con más votos.
  const BIN = 0.03;
  const contador = new Map<number, number>();
  for (const ioi of iois) {
    const bin = Math.round(ioi / BIN);
    contador.set(bin, (contador.get(bin) || 0) + 1);
  }
  let mejorBin = 0;
  let mejorCount = 0;
  for (const [bin, count] of contador) {
    if (count > mejorCount) {
      mejorCount = count;
      mejorBin = bin;
    }
  }
  if (mejorBin <= 0) return null;

  let bpm = 60 / (mejorBin * BIN);

  // Corrección de octava: los detectores de tempo confunden fácilmente el pulso con
  // su doble o su mitad (ej. detectar las corcheas en vez de la negra). Plegar al
  // rango típico de un cover de rock (70-180) antes de aceptar el resultado.
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  bpm = Math.round(bpm);
  if (bpm < 40 || bpm > 220) return null;

  return bpm;
}

/**
 * Calcula la energía global (1-20) combinando BPM detectado + volumen promedio,
 * ambos normalizados relativos a la banda.
 *
 * Se usa cuando se recalibra el repertorio: lee bpm y db_promedio de todas las canciones,
 * normaliza cada uno en su rango de banda, y promedia para la energía final.
 */
export function calcularEnergiaBpmVolumen(bpmDetectado: number, dbPromedio: number, bandStats: {
  minBpm: number;
  maxBpm: number;
  minDb: number;
  maxDb: number;
}): number {
  // Si el rango es muy pequeño, usar default
  if (bandStats.maxBpm - bandStats.minBpm < 5 && bandStats.maxDb - bandStats.minDb < 1) {
    return 10;
  }

  // Normalizar BPM a 0-10
  let bpmNorm = 5; // default si solo hay 1 BPM
  const bpmRango = bandStats.maxBpm - bandStats.minBpm;
  if (bpmRango > 5) {
    bpmNorm = ((bpmDetectado - bandStats.minBpm) / bpmRango) * 10;
    bpmNorm = Math.max(0, Math.min(10, bpmNorm));
  }

  // Normalizar volumen a 0-10
  let dbNorm = 5; // default si solo hay 1 volumen
  const dbRango = bandStats.maxDb - bandStats.minDb;
  if (dbRango > 0.5) {
    dbNorm = ((dbPromedio - bandStats.minDb) / dbRango) * 10;
    dbNorm = Math.max(0, Math.min(10, dbNorm));
  }

  // Promediar ambos factores y mapear a 1-20
  const promedio = (bpmNorm + dbNorm) / 2; // 0-10
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
 * frecuencia irregular. Frames de 100ms (n=800 a 8kHz) dan ~10 mediciones/segundo: es
 * la resolución mínima que hace falta para que `detectarBpmDesdeAudio` pueda ver golpes
 * de batería individuales. Antes esto medía 1 vez por segundo, y un tema a 120 BPM golpea
 * cada 0.5s — la mitad de rápido que la propia muestra, así que la detección de BPM era
 * físicamente imposible por mucho que se afinara el algoritmo.
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
    if (ficheroTemporal) {
      fs.unlink(ficheroTemporal, () => {});
    }
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
