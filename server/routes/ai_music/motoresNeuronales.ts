/**
 * Separación neuronal combinada: Replicate (MDX23 con caída a Demucs) y Fal.ai.
 */
import crypto from 'crypto';
import { descargarBufferSeguro } from '../../utils/ssrfGuard.js';
import { uploadBufferToSupabase, rutaAlmacenamientoStem } from '../../utils/storage.js';
import { ACTIVE_FAL_KEY } from '../../services/audioSeparator/FalAiService.js';
import { ProcessNeuralStemsResult } from './cacheStems.js';
import { processMdx23Stems } from './motorMdx23.js';
import { processDemucsStems } from './motorDemucs.js';
import { ensurePublicAudioUrl } from './audioPublico.js';

/**
 * Procesa la separación de stems con Red Neuronal en Replicate.
 * Utiliza MVSEP-MDX23 (MDX-Net + Demucs4) como modelo principal para una separación
 * de mayor pureza espectral en rangos de frecuencia medios y bajos sin artefactos de mezcla
 * ni voces fantasma, manteniendo HT-Demucs v4 como fallback automático y seguro si MDX23 falla.
 */
export async function processNeuralStemsReplicate(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string,
  overrideToken?: string
): Promise<ProcessNeuralStemsResult | null> {
  console.log(
    `[Neural Stems Replicate] 🚀 Iniciando separación con modelo principal MVSEP-MDX23...`
  );
  try {
    const mdxRes = await processMdx23Stems(
      audioUrl,
      bandId,
      songHash,
      requestHost,
      overrideToken
    );
    if (mdxRes && mdxRes.stemsMap && Object.keys(mdxRes.stemsMap).length > 0) {
      console.log(
        `[Neural Stems Replicate] ✅ Separación neuronal completada con éxito usando MVSEP-MDX23.`
      );
      return mdxRes;
    }
    console.warn(
      `[Neural Stems Replicate] ⚠️ MVSEP-MDX23 no devolvió stems válidos (${mdxRes?.error || 'sin resultado'}). Activando fallback a HT-Demucs v4...`
    );
  } catch (mdxErr: any) {
    console.warn(
      `[Neural Stems Replicate] ⚠️ Error durante la inferencia con MVSEP-MDX23:`,
      mdxErr?.message || mdxErr,
      `- Activando fallback a HT-Demucs v4...`
    );
  }

  // Fallback secundario a HT-Demucs v4 si MDX23 falla
  console.log(
    `[Neural Stems Replicate] 🔄 Ejecutando separación de respaldo con HT-Demucs v4 en Replicate...`
  );
  return await processDemucsStems(
    audioUrl,
    bandId,
    songHash,
    requestHost,
    overrideToken
  );
}

/**
 * Procesa la separación de stems con Fal.ai si FAL_KEY o FAL_API_KEY está configurado.
 */
export async function processNeuralStemsFal(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string
): Promise<Record<
  string,
  { url: string; formato: string; tamano: string }
> | null> {
  let rawFal = (process.env.FAL_KEY || process.env.FAL_API_KEY || '').trim();
  rawFal = rawFal
    .replace(/^["']|["']$/g, '')
    .replace(/^Key\s+/i, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const falKey =
    !rawFal || rawFal.startsWith('58e0800a') ? ACTIVE_FAL_KEY : rawFal;
  if (!falKey) return null;

  const effectiveBandId = bandId || 'sin-banda';
  const effectiveHash =
    songHash ||
    crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
    const resolvedUrl = await ensurePublicAudioUrl(
      audioUrl,
      effectiveBandId,
      effectiveHash,
      requestHost
    );
    console.log(
      `[Fal Neural] Iniciando separación de stems con Fal.ai Demucs desde: ${resolvedUrl}`
    );

    const authHeader = falKey.startsWith('Key ') ? falKey : `Key ${falKey}`;
    const res = await fetch('https://fal.run/fal-ai/demucs', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_url: resolvedUrl }),
    });

    if (!res.ok) {
      console.warn(
        '[Fal Neural] Petición a Fal.ai devolvió status:',
        res.status,
        await res.text()
      );
      return null;
    }

    const data = await res.json();
    const audioFiles = data.audio_files || data.output || data;
    if (!audioFiles) return null;

    const rawStemsMap: Record<string, string> = {};
    if (audioFiles.vocals)
      rawStemsMap['Voz'] =
        typeof audioFiles.vocals === 'string'
          ? audioFiles.vocals
          : audioFiles.vocals.url;
    if (audioFiles.drums)
      rawStemsMap['Batería'] =
        typeof audioFiles.drums === 'string'
          ? audioFiles.drums
          : audioFiles.drums.url;
    if (audioFiles.bass)
      rawStemsMap['Bajo'] =
        typeof audioFiles.bass === 'string'
          ? audioFiles.bass
          : audioFiles.bass.url;
    if (audioFiles.guitar)
      rawStemsMap['Guitarras'] =
        typeof audioFiles.guitar === 'string'
          ? audioFiles.guitar
          : audioFiles.guitar.url;
    if (audioFiles.piano)
      rawStemsMap['Teclados'] =
        typeof audioFiles.piano === 'string'
          ? audioFiles.piano
          : audioFiles.piano.url;
    if (audioFiles.other)
      rawStemsMap['Arreglos'] =
        typeof audioFiles.other === 'string'
          ? audioFiles.other
          : audioFiles.other.url;

    const persistentStemsMap: Record<
      string,
      { url: string; formato: string; tamano: string }
    > = {};

    await Promise.all(
      Object.entries(rawStemsMap).map(async ([instrumentKey, tempUrl]) => {
        let finalUrl = tempUrl;
        let sizeBytes = 0;
        if (
          tempUrl &&
          (tempUrl.startsWith('http://') || tempUrl.startsWith('https://'))
        ) {
          try {
            const fileRes = await descargarBufferSeguro(tempUrl);
            {
              if (fileRes) {
                const buffer = fileRes.buffer;
                sizeBytes = buffer.length;
                const instrumentClean = instrumentKey
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
                const storageSubPath = rutaAlmacenamientoStem(
                  effectiveBandId,
                  `stem-${instrumentClean}.mp3`,
                  effectiveHash
                );
                const supabaseUrl = await uploadBufferToSupabase(
                  buffer,
                  storageSubPath,
                  'audio/mpeg'
                );
                if (supabaseUrl) {
                  finalUrl = supabaseUrl;
                }
              }
            }
          } catch (storageErr: any) {
            console.warn(
              `[Fal Stems] Error guardando stem ${instrumentKey}:`,
              storageErr
            );
          }
        }

        const formattedSize =
          sizeBytes > 0
            ? sizeBytes < 1024 * 1024
              ? `${(sizeBytes / 1024).toFixed(0)} KB`
              : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
            : '2.8 MB';

        persistentStemsMap[instrumentKey] = {
          url: finalUrl,
          formato: 'MP3 (Fal.ai Demucs)',
          tamano: formattedSize,
        };
      })
    );

    return persistentStemsMap;
  } catch (err) {
    console.warn('Error invocando Fal.ai audio separation:', err);
    return null;
  }
}
