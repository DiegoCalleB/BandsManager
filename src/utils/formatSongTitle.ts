import { Song } from '../types';

const ROMAN_NUMERALS = new Set([
 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'
]);

const PRESERVE_LOWER = new Set(['feat.', 'ft.', 'vs.']);

/**
 * Normaliza y formatea el título de una canción con mayúsculas de nombres propios (Title / Proper Case).
 * Convierte títulos en ALL CAPS (ej. "SOME KIND OF WONDERFUL") o en minúsculas (ej. "born to be wild")
 * a un formato uniforme, elegante y profesional (ej. "Some Kind Of Wonderful", "Born To Be Wild").
 * Respeta números romanos (ej. "Part II"), siglas de colaboración (feat., ft.) y signos de puntuación/paréntesis.
 */
export function formatSongTitle(rawTitle?: string | null): string {
 if (!rawTitle || typeof rawTitle !== 'string') return '';
 const trimmed = rawTitle.trim();
 if (!trimmed) return '';

 // Separar tokens respetando espacios y signos de delimitación (, [ ] ( ) / - _ – — : " ' )
 const tokens = trimmed.split(/(\s+|[()\[\]/\-_–—:\",])/);

 const formatted = tokens.map((token) => {
 if (!token) return '';

 // Delimitadores y signos de puntuación
 if (/^[()\[\]/\-_–—:\",]+$/.test(token)) {
 return token;
 }

 // Espacios en blanco
 if (/^\s+$/.test(token)) {
 return token;
 }

 const upper = token.toUpperCase();
 const lower = token.toLowerCase();

 // Preservar números romanos
 if (ROMAN_NUMERALS.has(upper)) {
 return upper;
 }

 // Preservar términos especiales como feat. / ft.
 if (PRESERVE_LOWER.has(lower)) {
 return lower;
 }

 // Si comienza con comilla o apóstrofe (ej. 'N', "Intro")
 if ((lower.startsWith("'") || lower.startsWith('"')) && lower.length > 1) {
 const quote = lower.charAt(0);
 const rest = lower.slice(1);
 return quote + rest.charAt(0).toUpperCase() + rest.slice(1);
 }

 // Mayúscula inicial estilo nombre propio (Proper Case)
 return lower.charAt(0).toUpperCase() + lower.slice(1);
 });

 return formatted.join('');
}

/**
 * Recorre una lista de canciones y aplica el formateo de mayúsculas de nombres propios a sus títulos.
 * Devuelve la lista con los títulos actualizados y el conteo de temas modificados.
 */
export function normalizeSongTitlesInList(songs: Song[]): { updatedSongs: Song[]; changedCount: number } {
 if (!Array.isArray(songs)) return { updatedSongs: [], changedCount: 0 };

 let changedCount = 0;
 const updatedSongs = songs.map((s) => {
 const cleanTitle = formatSongTitle(s.titulo);
 if (cleanTitle !== s.titulo) {
 changedCount++;
 return { ...s, titulo: cleanTitle };
 }
 return s;
 });

 return { updatedSongs, changedCount };
}
