/**
 * Prepara el audio de un tema para los proveedores externos: URL pública verificada y versión comprimida para Replicate.
 */
import path from 'path';
import fs from 'fs';
import { descargarBufferSeguro, fetchUrlExternaSegura } from '../../utils/ssrfGuard.js';
import { uploadBufferToSupabase, rutaAlmacenamientoStem } from '../../utils/storage.js';
import { resolverDentroDe } from '../../utils/rutaContenida.js';
import { esHostDeAlmacenamientoConfiable } from './formatoStems.js';
import { transcodeBufferToMp3 } from './cacheStems.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

/**
 * Garantiza que cualquier URL o ruta local de audio se convierta en una URL HTTPS pública
 * alcanzable por Replicate subiéndola a Supabase Storage si no es pública.
 */
export async function ensurePublicAudioUrl(
  audioUrl: string,
  bandId: string,
  songHash: string,
  requestHost?: string
): Promise<string> {
  // Fast-path: Si audioUrl ya es una URL pública HTTPS directa en un CDN o Storage público
  if (esHostDeAlmacenamientoConfiable(audioUrl)) {
    console.log(
      "[Demucs Neural] URL de entrada ya es HTTPS pública directa en Supabase/CDN: %s...", audioUrl.substring(0, 60)
    );
    return audioUrl;
  }

  let buffer: Buffer | null = null;
  let ext = 'mp3';

  if (audioUrl.startsWith('data:audio/')) {
    try {
      const match = audioUrl.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        ext = match[1] || 'mp3';
        buffer = Buffer.from(match[2], 'base64');
      }
    } catch (e) {
      console.warn('[Demucs Neural] Error parseando data URL:', e);
    }
  } else {
    // 1. Intentar localizar en disco local primero
    const urlWithoutQuery = audioUrl.split('?')[0];
    const filenameOnly = path.basename(urlWithoutQuery);
    let subRel = '';
    if (urlWithoutQuery.includes('/uploads/')) {
      subRel = urlWithoutQuery.substring(
        urlWithoutQuery.indexOf('/uploads/') + '/uploads/'.length
      );
    }

    // Todo candidato debe quedar dentro de public/: audioUrl viene del cliente y un `..` (o un
    // nombre como "..") no puede sacar la lectura de ahí.
    const publicDir = path.join(process.cwd(), 'public');
    const candidatePaths = [
      subRel ? resolverDentroDe(publicDir, 'uploads', subRel) : null,
      resolverDentroDe(publicDir, urlWithoutQuery),
      resolverDentroDe(publicDir, 'uploads', filenameOnly),
      resolverDentroDe(publicDir, 'uploads', 'stems', 'inputs', filenameOnly),
      resolverDentroDe(publicDir, 'uploads', 'stems', filenameOnly),
      resolverDentroDe(publicDir, 'audio', filenameOnly),
      resolverDentroDe(publicDir, 'transposed', filenameOnly),
    ].filter((p): p is string => p !== null);

    const localPath = candidatePaths.find((p) => fs.existsSync(p));
    if (localPath) {
      try {
        buffer = fs.readFileSync(localPath);
        ext = path.extname(localPath).replace('.', '') || 'mp3';
        console.log(
          "[Demucs Neural] Archivo de entrada encontrado en disco local (%s) - %s bytes", localPath, buffer.length
        );
      } catch (e) {
        console.warn(
          '[Demucs Neural] Error leyendo archivo de audio local:',
          e
        );
      }
    } else if (
      audioUrl.startsWith('http://') ||
      audioUrl.startsWith('https://')
    ) {
      try {
        const res = await descargarBufferSeguro(audioUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', Accept: '*/*' },
        });
        if (res) {
          buffer = res.buffer;
          ext = path.extname(urlWithoutQuery).replace('.', '') || 'mp3';
        }
      } catch (e) {
        console.warn(
          '[Demucs Neural] Error obteniendo URL de audio de entrada para espejo público:',
          e
        );
      }
    }
  }

  // Si tenemos el buffer, subirlo a Supabase Storage para que Replicate tenga una URL pública universal 100% garantizada
  if (buffer && buffer.length > 0) {
    const storageSubPath = rutaAlmacenamientoStem(
      bandId,
      `input-audio-${Date.now()}.${ext}`,
      songHash
    );
    const mimeType =
      ext === 'wav'
        ? 'audio/wav'
        : ext === 'flac'
          ? 'audio/flac'
          : 'audio/mpeg';
    const uploadedPublicUrl = await uploadBufferToSupabase(
      buffer,
      storageSubPath,
      mimeType
    );
    if (uploadedPublicUrl) {
      console.log(
        "[Demucs Neural] Audio de entrada subido a Supabase Storage para Replicate: %s", uploadedPublicUrl
      );
      return uploadedPublicUrl;
    }

    // Fallback: Si Supabase Storage no está disponible pero el buffer es manejable (<12MB),
    // Replicate acepta Data URIs base64 directamente en el parámetro audio
    if (buffer.length <= 12 * 1024 * 1024) {
      console.log(
        "[Demucs Neural] Utilizando Data URI base64 directo para Replicate (%s MB)...", (buffer.length / 1024 / 1024).toFixed(2)
      );
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }
  }

  // Resolver dominio público HTTPS para Replicate (soporta bandmanager.io / custom domains y Railway)
  const publicDomain =
    process.env.APP_URL ||
    process.env.PUBLIC_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RAILWAY_STATIC_URL ||
    'https://bandmanager.io';
  if (audioUrl.startsWith('/')) {
    if (publicDomain) {
      const cleanDomain = publicDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      return `https://${cleanDomain}${audioUrl}`;
    }
    if (
      requestHost &&
      !requestHost.includes('localhost') &&
      !requestHost.includes('127.0.0.1')
    ) {
      const proto = requestHost.includes(':') ? 'http' : 'https';
      return `${proto}://${requestHost}${audioUrl}`;
    }
  }

  return audioUrl;
}

/**
 * Comprime el audio de entrada a MP3 antes de mandarlo a la GPU de Replicate cuando llega sin
 * comprimir o pesa de más (WAV/FLAC de estudio, másteres a 24-bit/48kHz...). Un máster así puede
 * pesar 5-10x un MP3 equivalente: menos tiempo de subida y de decodificación en el contenedor
 * antes de que la GPU empiece a separar nada. Si el audio ya es un MP3 razonablemente ligero, o
 * si algo falla al comprimir/resubir, se sigue con la URL original sin bloquear la separación.
 */
export async function ensureCompressedAudioForReplicate(
  url: string,
  bandId: string,
  songHash: string
): Promise<string> {
  if (!url) return url;
  if (url.startsWith('data:audio/mpeg') || url.startsWith('data:audio/mp3'))
    return url;

  const MAX_MP3_SIZE = 10 * 1024 * 1024; // Un MP3 ya comprimido de este tamaño no merece recomprimirse
  const MIN_WORTHWHILE_SIZE = 300 * 1024; // Clips muy cortos no compensan el viaje de ida y vuelta

  try {
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    const headRes = await fetchUrlExternaSegura(url, {
      method: 'HEAD',
      headers: fetchHeaders,
      timeoutMs: 8000,
      maxRedirects: 3,
    });
    const contentType = String(
      headRes.headers['content-type'] || ''
    ).toLowerCase();
    const contentLength = parseInt(
      String(headRes.headers['content-length'] || '0'),
      10
    );
    const urlLooksLikeMp3 = url.toLowerCase().split('?')[0].endsWith('.mp3');
    const alreadyMp3 =
      contentType.includes('mpeg') ||
      contentType.includes('mp3') ||
      urlLooksLikeMp3;

    if (alreadyMp3 && contentLength > 0 && contentLength <= MAX_MP3_SIZE)
      return url;
    if (contentLength > 0 && contentLength <= MIN_WORTHWHILE_SIZE) return url;
  } catch {
    // Si el HEAD falla (algún CDN no lo soporta), seguimos e intentamos comprimir igualmente.
  }

  try {
    const res = await descargarBufferSeguro(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', Accept: '*/*' },
      timeoutMs: 45000,
    });
    if (!res) return url;
    const original = res.buffer;
    if (original.length === 0) return url;

    const compressed = await transcodeBufferToMp3(original);
    if (compressed.length === 0 || compressed.length >= original.length)
      return url;

    const storageSubPath = rutaAlmacenamientoStem(
      bandId,
      `input-compressed-${Date.now()}.mp3`,
      songHash
    );
    const uploadedUrl = await uploadBufferToSupabase(
      compressed,
      storageSubPath,
      'audio/mpeg'
    );
    if (uploadedUrl) {
      console.log(
        "[Replicate Input Compression] %sMB -> %sMB antes de enviar a Replicate (%s).", (original.length / 1024 / 1024).toFixed(1), (compressed.length / 1024 / 1024).toFixed(1), storageSubPath
      );
      return uploadedUrl;
    }
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.warn(
      '[Replicate Input Compression] No se pudo comprimir el audio de entrada, se usa el original:',
      err?.message || err
    );
  }

  return url;
}
