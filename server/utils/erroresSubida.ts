/** Mensajes de `/api/upload` que ve la persona usuaria (salen tal cual en el aviso de «No se pudo guardar el cambio»). */
export const MENSAJE_TIPO_NO_PERMITIDO =
  'Este tipo de archivo no se puede subir. Admitimos audio (MP3, WAV, M4A, FLAC, OGG), imagen (JPG, PNG, WEBP, GIF), vídeo, PDF y Word.';

export const mensajeFirmaNoValida = (ext: string) =>
  `El contenido del archivo no es un ${ext ? ext.toUpperCase() : ''} válido: puede estar dañado o tener la extensión cambiada. Expórtalo de nuevo (por ejemplo a MP3 o WAV) e inténtalo otra vez.`;
