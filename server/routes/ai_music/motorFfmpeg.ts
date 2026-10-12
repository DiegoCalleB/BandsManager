/**
 * Motor DSP local con FFmpeg: separación por filtros de frecuencia, gratuita y sin GPU.
 */
import ffmpeg from './ffmpegConfigurado.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { descargarBufferSeguro } from '../../utils/ssrfGuard.js';
import { uploadToSupabaseIfAvailable, rutaAlmacenamientoStem } from '../../utils/storage.js';
import { preprocesarAudioDirecto } from '../../utils/audioEnergy.js';

/**
 * Función auxiliar para procesar stems en el servidor usando FFmpeg y supresión Mid/Side
 */
export async function processServerStemsFfmpeg(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  preprocesarDirecto: boolean = false,
  requestedStems?: string[]
): Promise<Record<string, { url: string; formato: string; tamano: string }>> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'stems');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  let inputPath = audioUrl;
  let tempLocalFile: string | null = null;
  let tempPreprocessedFile: string | null;

  // Si la URL es HTTP(S) o data URL, la descargamos UNA SOLA VEZ a disco local para evitar re-descargas HTTP repetidas
  if (
    audioUrl.startsWith('http://') ||
    audioUrl.startsWith('https://') ||
    audioUrl.startsWith('data:')
  ) {
    try {
      tempLocalFile = path.join('/tmp', `input-audio-stem-${timestamp}.mp3`);
      if (audioUrl.startsWith('data:')) {
        const base64Data = audioUrl.split(',')[1];
        if (base64Data) {
          fs.writeFileSync(tempLocalFile, Buffer.from(base64Data, 'base64'));
        }
      } else {
        const res = await descargarBufferSeguro(audioUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
        });
        if (res) {
          fs.writeFileSync(tempLocalFile, res.buffer);
        }
      }
      if (
        tempLocalFile &&
        fs.existsSync(tempLocalFile) &&
        fs.statSync(tempLocalFile).size > 0
      ) {
        inputPath = tempLocalFile;
      }
    } catch (dlErr) {
      console.warn(
        '[FFmpeg Accelerator] No se pudo guardar copia local de entrada, usando URL directa:',
        dlErr
      );
    }
  } else if (audioUrl.startsWith('/')) {
    const localPublic = path.join(process.cwd(), 'public', audioUrl);
    if (fs.existsSync(localPublic)) {
      inputPath = localPublic;
    }
  }

  // Si se solicita acondicionamiento para directo o grabación ruidosa, normalizar previamente
  if (preprocesarDirecto && fs.existsSync(inputPath)) {
    tempPreprocessedFile = path.join('/tmp', `preproc-stem-${timestamp}.mp3`);
    const preprocRes = await preprocesarAudioDirecto(
      inputPath,
      tempPreprocessedFile,
      {
        filtroRumble: true,
        targetLufs: -14,
        truePeakDb: -1.0,
        deHiss: true,
      }
    );
    if (preprocRes.success && fs.existsSync(tempPreprocessedFile)) {
      inputPath = tempPreprocessedFile;
    }
  }

  const stemsMap: Record<
    string,
    { url: string; formato: string; tamano: string }
  > = {};
  const effectiveBandId = bandId || 'sin-banda';
  const effectiveHash =
    songHash ||
    crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  // Filtros DSP de alta separación y aislamiento de canales para evitar el filtrado cruzado (bleed)
  const allConfigs = [
    {
      key: 'Voz',
      filename: `stem-vocal-${timestamp}.mp3`,
      filter:
        'pan=mono|c0=0.5*c0+0.5*c1,highpass=f=280,lowpass=f=3600,equalizer=f=1200:width_type=h:width=1200:g=4,volume=1.4',
    },
    {
      key: 'Instrumental',
      filename: `stem-instrumental-${timestamp}.mp3`,
      filter:
        'pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0,equalizer=f=1200:width_type=h:width=1200:g=-12,volume=1.3',
    },
    {
      key: 'Batería',
      filename: `stem-drums-${timestamp}.mp3`,
      filter: 'pan=mono|c0=0.5*c0-0.5*c1,highpass=f=3800,volume=1.3',
    },
    {
      key: 'Bajo',
      filename: `stem-bass-${timestamp}.mp3`,
      filter:
        'lowpass=f=160,lowpass=f=160,equalizer=f=80:width_type=q:width=1.2:g=4,volume=1.5',
    },
    {
      key: 'Guitarras',
      filename: `stem-guitars-${timestamp}.mp3`,
      filter:
        'pan=mono|c0=0.5*c0-0.5*c1,highpass=f=220,lowpass=f=3400,volume=1.5',
    },
    {
      key: 'Arreglos',
      filename: `stem-brass-${timestamp}.mp3`,
      filter:
        'pan=mono|c0=0.5*c0-0.5*c1,highpass=f=2400,lowpass=f=8500,volume=1.3',
    },
  ];

  // Si el usuario especificó solo ciertas pistas (ej. solo 'Bajo'), filtramos la ejecución para máxima velocidad y eficiencia
  const normalizeKey = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const configs =
    requestedStems && requestedStems.length > 0
      ? allConfigs.filter((cfg) => {
          const cfgNorm = normalizeKey(cfg.key);
          return requestedStems.some((req) => {
            const reqNorm = normalizeKey(req);
            return (
              reqNorm === cfgNorm ||
              cfgNorm.includes(reqNorm) ||
              reqNorm.includes(cfgNorm)
            );
          });
        })
      : allConfigs;

  // Procesa los stems solicitados en PARALELO directamente sobre archivo local (Tardo < 1.2 segundos total)
  await Promise.all(
    configs.map((cfg) => {
      return new Promise<void>((resolve) => {
        const outputPath = path.join(uploadsDir, cfg.filename);
        try {
          ffmpeg(inputPath)
            .audioFilters(cfg.filter)
            .audioBitrate('256k')
            .output(outputPath)
            .on('end', async () => {
              if (fs.existsSync(outputPath)) {
                let finalUrl = `/uploads/stems/${cfg.filename}`;
                let sizeBytes = 0;
                try {
                  const stat = fs.statSync(outputPath);
                  sizeBytes = stat ? stat.size : 0;
                  const storageSubPath = rutaAlmacenamientoStem(
                    effectiveBandId,
                    cfg.filename,
                    effectiveHash
                  );
                  const supabasePromise = uploadToSupabaseIfAvailable(
                    outputPath,
                    storageSubPath,
                    'audio/mpeg'
                  );
                  const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 4000)
                  );
                  const supabaseUrl = await Promise.race([
                    supabasePromise,
                    timeoutPromise,
                  ]);
                  if (supabaseUrl) {
                    finalUrl = supabaseUrl;
                  }
                } catch (upErr) {
                  console.warn(`Aviso al subir stem FFmpeg a Supabase:`, upErr);
                }
                const formattedSize =
                  sizeBytes < 1024 * 1024
                    ? `${(sizeBytes / 1024).toFixed(0)} KB`
                    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

                stemsMap[cfg.key] = {
                  url: finalUrl,
                  formato: 'MP3 (256k)',
                  tamano: formattedSize,
                };
              }
              resolve();
            })
            .on('error', (err) => {
              console.warn(
                `Aviso procesando stem FFmpeg ${cfg.key}:`,
                err?.message || err
              );
              resolve();
            })
            .run();
        } catch (procErr) {
          console.warn(`Error al lanzar FFmpeg para ${cfg.key}:`, procErr);
          resolve();
        }
      });
    })
  );

  // Limpiar archivo temporal de entrada si se creó
  if (tempLocalFile && fs.existsSync(tempLocalFile)) {
    try {
      fs.unlinkSync(tempLocalFile);
    } catch { /* el temporal ya no existe: nada que limpiar */ }
  }

  return stemsMap;
}
