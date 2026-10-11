/**
 * Caché en memoria de stems, deduplicación de separaciones en curso, transcodificación a MP3 y persistencia de los stems crudos.
 */
import ffmpeg from './ffmpegConfigurado.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { descargarBufferSeguro } from '../../utils/ssrfGuard.js';
import { stemStorageRetryManager } from '../../services/stemStorageRetryQueue.js';
import { uploadBufferToSupabase, rutaAlmacenamientoStem } from '../../utils/storage.js';
import { StemErrorType, MusicServiceErrorProvider } from './diagnosticos.js';
import type { AudioSeparatorResult } from '../../services/audioSeparator/AudioSeparatorService.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

export interface ProcessNeuralStemsResult {
  stemsMap: Record<
    string,
    { url: string; formato: string; tamano: string }
  > | null;
  /** Tiempos por fase que informa el motor; se guarda y se devuelve sin interpretarlo. */
  timingBreakdown?: unknown;
  error?: string;
  errorType?: StemErrorType;
  errorTitle?: string;
  actionAdvice?: string;
  errorDetail?: string;
  httpStatus?: number;
  provider?: MusicServiceErrorProvider;
  engine?: string;
  cached?: boolean;
}

// ============================================================================
// CACHÉ Y MUTEX ANTI-DUPLICACIÓN (Garantía de Cero Coste Duplicado en Replicate/GPU)
// ============================================================================
export interface CachedStemsEntry {
  stemsMap: Record<string, { url: string; formato: string; tamano: string }>;
  /** Tiempos por fase que informa el motor; se guarda y se devuelve sin interpretarlo. */
  timingBreakdown: unknown;
  engine: string;
  engineUsed?: string;
  degraded?: boolean;
  degradedReason?: string;
  isNeural: boolean;
  timestamp: number;
}

export const stemsMemoryCache = new Map<string, CachedStemsEntry>();
/** Resultado de una separación en curso, compartido con las peticiones duplicadas que la esperan. */
export interface ResultadoSeparacionEnVuelo {
  stemsMap: Record<string, { url: string; formato: string; tamano: string }> | null;
  /** Tiempos por fase que informa el motor; se guarda y se devuelve sin interpretarlo. */
  timingBreakdown?: unknown;
  engine: string;
  engineUsed?: string;
  degraded?: boolean;
  degradedReason?: string;
  isNeural: boolean;
  cached?: boolean;
  /** Diagnóstico del proveedor cuando la separación falló. */
  errorInfo?: ProcessNeuralStemsResult | AudioSeparatorResult | null;
}

export const inFlightSeparations = new Map<string, Promise<ResultadoSeparacionEnVuelo>>();

/**
 * Descarga y persiste de forma permanente una lista de stems en Supabase Storage
 * (con fallback seguro en disco local), garantizando que las URLs efímeras de Replicate
 * o microservicios GPU nunca expiren para la banda.
 */
/**
 * Recomprime un buffer de audio a MP3 real (192kbps) vía FFmpeg antes de persistirlo.
 * Los stems que devuelve Replicate llegan como WAV sin comprimir con extensión .mp3 en el
 * nombre — un stem aislado de una canción entera puede pesar 40-80MB así, muy por encima del
 * límite de 50MB del plan gratuito de Supabase Storage. Un MP3 real a 192kbps pesa una fracción
 * de eso sin pérdida perceptible para un instrumento aislado de ensayo.
 * Si la transcodificación falla por cualquier motivo, devuelve el buffer original sin tocar.
 */
export async function transcodeBufferToMp3(buffer: Buffer): Promise<Buffer> {
  const tmpId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const inputPath = path.join(os.tmpdir(), `stem-in-${tmpId}`);
  const outputPath = path.join(os.tmpdir(), `stem-out-${tmpId}.mp3`);

  try {
    fs.writeFileSync(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate('192k')
        .toFormat('mp3')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return fs.readFileSync(outputPath);
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.warn(
      '[Neural Stems] No se pudo recomprimir el stem a MP3, se sube el buffer original:',
      err?.message || err
    );
    return buffer;
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch { /* el temporal ya no existe: nada que limpiar */ }
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch { /* el temporal ya no existe: nada que limpiar */ }
  }
}

export async function persistRawStemsMap(
  rawStemsMap: Record<string, string>,
  effectiveBandId: string,
  effectiveHash: string,
  formatLabel: string
): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
  const persistentStemsMap: Record<
    string,
    { url: string; formato: string; tamano: string }
  > = {};
  const stemsUploadsDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'stems'
  );
  if (!fs.existsSync(stemsUploadsDir)) {
    fs.mkdirSync(stemsUploadsDir, { recursive: true });
  }

  await Promise.all(
    Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
      let finalUrl = '';
      let sizeBytes = 0;
      if (
        tempUrl &&
        (tempUrl.startsWith('http://') || tempUrl.startsWith('https://'))
      ) {
        try {
          const fileRes = await descargarBufferSeguro(tempUrl, {
            timeoutMs: 45000,
          });
          {
            if (fileRes) {
              const rawBuffer = fileRes.buffer;
              // Replicate devuelve WAV sin comprimir con extensi\u00f3n .mp3 en el nombre: un stem
              // aislado de una canci\u00f3n entera puede superar los 50MB del l\u00edmite gratuito de
              // Supabase Storage. Recomprimimos a MP3 real antes de subir.
              const buffer = await transcodeBufferToMp3(rawBuffer);
              sizeBytes = buffer.length;
              const instrumentClean = instrumentKey
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
              const filename = `stem-${instrumentClean}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`;
              const storageSubPath = rutaAlmacenamientoStem(
                effectiveBandId,
                filename,
                effectiveHash
              );

              // 1. Intentar guardar en Supabase Storage permanente
              const supabaseUrl = await uploadBufferToSupabase(
                buffer,
                storageSubPath,
                'audio/mpeg'
              );
              if (supabaseUrl) {
                finalUrl = supabaseUrl;
                console.log(
                  `[Neural Stems] Guardado permanente en Supabase para ${instrumentKey}: ${supabaseUrl}`
                );
              } else {
                // 2. Buffer temporal en disco de tránsito con reintento automático hacia Supabase
                const localPath = path.join(stemsUploadsDir, filename);
                fs.writeFileSync(localPath, buffer);
                finalUrl = `/uploads/stems/${filename}`;
                console.warn(
                  `[Neural Stems] ⚠️ Subida inmediata a Supabase no disponible. Almacenado en buffer efímero de tránsito (${localPath}) y encolado para reintento con backoff.`
                );
                stemStorageRetryManager.enqueue(
                  localPath,
                  storageSubPath,
                  effectiveBandId,
                  'audio/mpeg',
                  5
                );
              }
            }
          }
        } catch (storageErrCapturado) {
          const storageErr = comoErrorCapturado(storageErrCapturado);
          console.warn(
            `[Neural Stems] Error descargando o persistiendo stem ${instrumentKey}:`,
            storageErr?.message || storageErr
          );
        }
      }

      if (!finalUrl) {
        finalUrl = tempUrl;
      }

      const formattedSize =
        sizeBytes > 0
          ? sizeBytes < 1024 * 1024
            ? `${(sizeBytes / 1024).toFixed(0)} KB`
            : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : '3.1 MB';

      persistentStemsMap[instrumentKey] = {
        url: finalUrl,
        formato: formatLabel,
        tamano: formattedSize,
      };
    })
  );

  return persistentStemsMap;
}
