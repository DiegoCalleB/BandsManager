import fs from 'fs';
import path from 'path';
import { uploadBufferToSupabase, rutaAlmacenamientoStem, esUrlExternaSegura } from '../../utils/storage.js';
import { stemStorageRetryManager } from '../stemStorageRetryQueue.js';
import { transcodeBufferToMp3 } from '../audioTransposeService.js';

export interface AudioSeparatorOptions {
  bandId?: string;
  songHash?: string;
  songTitle?: string;
  sectionName?: string;
  bpm?: number;
  key?: string;
  requestedStems?: string[];
  requestHost?: string;
}

export interface AudioSeparatorResult {
  success: boolean;
  provider: 'lalalai' | 'replicate' | 'fal' | 'ffmpeg' | 'system';
  engine: string;
  engineUsed: string;
  isNeural: boolean;
  degraded: boolean;
  degradedReason?: string;
  stemsMap: Record<string, { url: string; formato: string; tamano: string }>;
  timingBreakdown?: any;
  errorTitle?: string;
  error?: string;
  actionAdvice?: string;
  errorDetail?: string;
  httpStatus?: number;
}

export interface AudioSeparatorJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  progressPct?: number;
  result?: AudioSeparatorResult;
  error?: string;
}

/**
 * Interface y Clase Abstracta base para servicios de separación de audio.
 * Aplica el Patrón Adaptador (Adapter Pattern) para aislar la lógica de negocio
 * de los proveedores de IA de terceros (LALAL.AI, Replicate, Fal.ai, DSP Local).
 */
export abstract class AudioSeparatorService {
  abstract readonly providerName: 'lalalai' | 'replicate' | 'fal' | 'ffmpeg' | 'system';
  abstract readonly defaultEngineName: string;

  /**
   * Envía la canción al proveedor de IA para extraer las pistas aisladas (stems).
   */
  abstract processAudio(
    fileUrl: string,
    options?: AudioSeparatorOptions
  ): Promise<AudioSeparatorResult>;

  /**
   * Consulta el estado asíncrono de un trabajo enviado previamente.
   */
  abstract getJobStatus(jobId: string): Promise<AudioSeparatorJobStatus>;

  /**
   * Método compartido para descargar stems del proveedor de IA y subirlos de forma
   * inmutable a Supabase Storage (`stems/{bandId}/{songHash}/...`).
   */
  protected async downloadAndPersistStems(
    rawStemsMap: Record<string, string>,
    bandId: string,
    songHash: string,
    formatLabel: string
  ): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
    const persistentStemsMap: Record<string, { url: string; formato: string; tamano: string }> = {};
    const effectiveBandId = bandId || 'sin-banda';
    const effectiveHash = songHash || 'default-hash';
    const stemsUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'stems');

    if (!fs.existsSync(stemsUploadsDir)) {
      fs.mkdirSync(stemsUploadsDir, { recursive: true });
    }

    await Promise.all(
      Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
        let finalUrl = '';
        let sizeBytes = 0;

        if (tempUrl && (tempUrl.startsWith('http://') || tempUrl.startsWith('https://'))) {
          try {
            const isSafe =
              tempUrl.includes('lalal.ai') ||
              tempUrl.includes('replicate.delivery') ||
              tempUrl.includes('supabase.co') ||
              (await esUrlExternaSegura(tempUrl));

            if (isSafe) {
              const fileRes = await fetch(tempUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*'
                },
                signal: AbortSignal.timeout(60000)
              });

              if (fileRes.ok) {
                const arrayBuf = await fileRes.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuf);

                // Transcodificar a MP3 de alta fidelidad de 320kbps
                const buffer = await transcodeBufferToMp3(rawBuffer);
                sizeBytes = buffer.length;

                const instrumentClean = instrumentKey
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
                const filename = `stem-${instrumentClean}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`;
                const storageSubPath = rutaAlmacenamientoStem(effectiveBandId, filename, effectiveHash);

                // 1. Persistencia Inmutable en Supabase Storage
                const supabaseUrl = await uploadBufferToSupabase(buffer, storageSubPath, 'audio/mpeg');
                if (supabaseUrl) {
                  finalUrl = supabaseUrl;
                  console.log(`[AudioSeparator] ✅ Stem ${instrumentKey} guardado en Supabase Storage: ${supabaseUrl}`);
                } else {
                  // 2. Fallback temporal en disco local con cola de reintento
                  const localPath = path.join(stemsUploadsDir, filename);
                  fs.writeFileSync(localPath, buffer);
                  finalUrl = `/uploads/stems/${filename}`;
                  console.warn(`[AudioSeparator] ⚠️ Fallback local para stem ${instrumentKey} (${localPath}). Encolado para Supabase Storage.`);
                  stemStorageRetryManager.enqueue(localPath, storageSubPath, effectiveBandId, 'audio/mpeg', 5);
                }
              }
            }
          } catch (err: any) {
            console.warn(`[AudioSeparator] Error descargando o persistiendo stem ${instrumentKey}:`, err?.message || err);
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
          tamano: formattedSize
        };
      })
    );

    return persistentStemsMap;
  }
}
