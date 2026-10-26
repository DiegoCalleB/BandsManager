/**
 * Extensión que corresponde al contenido real de un audio según su tipo MIME. El servidor comprueba
 * la firma binaria contra la extensión (`validarMagicBytes`): un WebM/MP4 grabado en el navegador
 * subido como «.mp3» se rechaza con «Magic Bytes mismatch».
 */
export function extensionDeAudio(tipo: string): string {
  const t = (tipo || '').toLowerCase();
  if (t.includes('wav')) return 'wav';
  if (t.includes('flac')) return 'flac';
  if (t.includes('webm')) return 'webm';
  if (t.includes('ogg') || t.includes('opus')) return 'ogg';
  if (t.includes('aac') && !t.includes('mp4')) return 'aac';
  if (t.includes('mp4') || t.includes('m4a')) return 'm4a';
  return 'mp3';
}
