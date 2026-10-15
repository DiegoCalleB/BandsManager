/**
 * Canciones cuyo audio se está procesando ahora mismo («El Oído»: acordes y letra), clave `${bandId}:${songId}`.
 * Compartido entre las rutas y la cola de letras para que nunca se transcriba dos veces a la vez la misma canción.
 */
export const analisisAcordesEnCurso = new Set<string>();
