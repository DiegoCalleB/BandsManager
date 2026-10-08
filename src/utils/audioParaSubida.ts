import { uploadFileToServer, resolveAudioUrl, getAudioBlobFromUrl } from './audioStorage';

/**
 * Resuelve la URL de audio de una idea a una URL real y permanente en el servidor, subiéndola
 * si hace falta.
 *
 * `idea.audioUrl` puede ser legítimamente blob:/indexeddb:/data: justo después de grabar o
 * importar audio (vive local en el navegador hasta que algo lo sube de verdad) — nunca lanza,
 * si algo falla devuelve la URL original tal cual en vez de bloquear a quien llama.
 *
 * Usar esto SIEMPRE antes de mandar el audio de una idea a cualquier sitio que no sea el
 * propio navegador (separar pistas, fijarla como maqueta principal de la canción...): guardar
 * una blob: url como si fuera permanente dejaba una referencia rota en cuanto se usaba fuera
 * de esa pestaña — server-side ni siquiera puede descargarla para analizar BPM/tonalidad.
 */
export async function resolverAudioUrlParaSubida(rawUrl: string): Promise<string> {
  let resultado = rawUrl;
  try {
    const resolved = await resolveAudioUrl(rawUrl);
    if (resolved) resultado = resolved;

    if (resultado.startsWith('indexeddb:') || resultado.startsWith('blob:') || resultado.startsWith('data:')) {
      const blob = await getAudioBlobFromUrl(rawUrl);
      const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'mp3';
      const file = new File([blob], `input-audio-idea-${Date.now()}.${ext}`, {
        type: blob.type || 'audio/mpeg',
      });
      const bandIdToUse = localStorage.getItem('bandmanager_band_id') || undefined;
      const uploadedUrl = await uploadFileToServer(file, {
        category: 'stems',
        folder: 'inputs',
        bandId: bandIdToUse,
      });
      if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://') || uploadedUrl.startsWith('/'))) {
        resultado = uploadedUrl;
      }
    }
  } catch (err) {
    console.warn('[Audio] No se pudo resolver la URL de audio a una permanente:', err);
  }
  return resultado;
}
