import { Setlist, Song, SetlistItem } from '../types';

/**
 * Calcula la duración total en segundos de un setlist sumando
 * tanto las canciones como los bloques hablados/descansos/bis.
 */
export function calculateSetlistDurationSec(setlist: Setlist, songs: Song[]): number {
 if (!setlist || !setlist.items) return 0;
 const songMap = new Map(songs.map(s => [s.id, s]));

 let totalSec = 0;
 for (const item of setlist.items) {
 if (item.tipoItem === 'cancion' && item.songId) {
 const s = songMap.get(item.songId);
 if (s) {
 if (s.duracionSegundos && s.duracionSegundos > 0) {
 totalSec += s.duracionSegundos;
 } else if (s.duracion) {
 // Parse "mm:ss"
 const parts = s.duracion.split(':');
 if (parts.length === 2) {
 const m = parseInt(parts[0], 10) || 0;
 const sec = parseInt(parts[1], 10) || 0;
 totalSec += m * 60 + sec;
 }
 }
 }
 } else if (item.tipoItem === 'bloque') {
 if (item.duracionEstimadaSegundos && item.duracionEstimadaSegundos > 0) {
 totalSec += item.duracionEstimadaSegundos;
 } else if (item.duracionEstimadaMinutos && item.duracionEstimadaMinutos > 0) {
 totalSec += item.duracionEstimadaMinutos * 60;
 } else {
 // Duración estándar por defecto de bloque (2 min presentación/chapa, 1 min cambio, 3 min bis)
 switch (item.bloqueSubtipo) {
 case 'bis':
 totalSec += 180;
 break;
 case 'cambio_instrumento':
 totalSec += 60;
 break;
 case 'descanso':
 totalSec += 300;
 break;
 default:
 totalSec += 120;
 break;
 }
 }
 }
 }

 return totalSec;
}

export interface SetlistMatchResult {
 setlist: Setlist;
 durationMin: number;
 differenceMin: number;
 reason: string;
}

/**
 * Encuentra el setlist existente que mejor se adapta a la duración pactada
 * y al estilo/formato del evento (festival, sala, acústico).
 */
export function findBestSetlistMatch(
 setlists: Setlist[],
 songs: Song[],
 targetMinutes: number,
 targetFormat?: string
): SetlistMatchResult | null {
 if (!setlists || setlists.length === 0) return null;

 let bestMatch: SetlistMatchResult | null = null;
 let lowestScore = Infinity;

 const normalizedFormat = (targetFormat || '').toLowerCase();
 const isFestival = normalizedFormat.includes('fest') || normalizedFormat.includes('aire');
 const isAcustico = normalizedFormat.includes('acust') || normalizedFormat.includes('bar');

 for (const st of setlists) {
 const totalSec = calculateSetlistDurationSec(st, songs);
 const durationMin = Math.round(totalSec / 60);
 const diff = Math.abs(durationMin - targetMinutes);

 // Bonus por coincidencia de formato
 let formatPenalty = 0;
 if (isFestival && st.tipoFormato !== 'festival') formatPenalty += 8;
 if (isAcustico && st.tipoFormato !== 'acustico') formatPenalty += 8;

 const score = diff * 2 + formatPenalty;

 if (score < lowestScore) {
 lowestScore = score;
 let reason = '';
 if (diff === 0) {
 reason = `Duración exacta (${durationMin} min)`;
 } else if (diff <= 5) {
 reason = `Ajuste óptimo (${durationMin} min vs ${targetMinutes} min objetivo)`;
 } else {
 reason = `Setlist más cercano (${durationMin} min)`;
 }

 if (isFestival && st.tipoFormato === 'festival') {
 reason += '· Formato festival';
 }

 bestMatch = {
 setlist: st,
 durationMin,
 differenceMin: diff,
 reason
 };
 }
 }

 return bestMatch;
}

/**
 * Genera una propuesta de setlist automática seleccionando canciones
 * del catálogo ordenadas por energía hasta cubrir la duración deseada.
 */
export function generateAutoSetlistForConcert(
 venueName: string,
 targetMinutes: number,
 songs: Song[],
 isFestival: boolean = false
): { nombre: string; items: SetlistItem[]; estimatedDurationMin: number } {
 const targetSec = targetMinutes * 60;
 const nombre = `Bolo ${venueName || 'Directo'} (${targetMinutes} min)`;

 // Ordenar canciones por energía descendente si es festival, o balanceada para sala
 const availableSongs = [...songs].filter(s => s.id);
 if (availableSongs.length === 0) {
 return {
 nombre,
 items: [],
 estimatedDurationMin: 0
 };
 }

 // Si es festival, priorizamos temas con más energía o favoritos
 if (isFestival) {
 availableSongs.sort((a, b) => {
 const energyA = (a.energia || 10) + (a.favoritoGeneral ? 5 : 0);
 const energyB = (b.energia || 10) + (b.favoritoGeneral ? 5 : 0);
 return energyB - energyA;
 });
 }

 const items: SetlistItem[] = [];
 let accumulatedSec = 0;

 // Canción de apertura potente
 let songIndex = 0;
 while (songIndex < availableSongs.length && accumulatedSec < targetSec) {
 const s = availableSongs[songIndex];
 const duration = s.duracionSegundos || 210; // 3:30 min por defecto

 // Insertar saludo de bienvenida tras el segundo tema si hay tiempo
 if (items.length === 2 && targetMinutes >= 45) {
 items.push({
 id: `block-saludo-${Date.now()}`,
 tipoItem: 'bloque',
 bloqueSubtipo: 'presentacion',
 tituloCustom: 'Saludo al público',
 duracionEstimadaMinutos: 2
 });
 accumulatedSec += 120;
 }

 // Si ya estamos cerca del final y es concierto de más de 60 min, insertar pausa antes de los bises
 if (items.length > 5 && accumulatedSec + duration > targetSec - 300 && targetMinutes >= 60) {
 items.push({
 id: `block-bis-${Date.now()}`,
 tipoItem: 'bloque',
 bloqueSubtipo: 'bis',
 tituloCustom: 'Petición de Bises / Parón',
 duracionEstimadaMinutos: 2
 });
 accumulatedSec += 120;
 }

 items.push({
 id: `item-auto-${s.id}-${Date.now()}-${songIndex}`,
 tipoItem: 'cancion',
 songId: s.id
 });
 accumulatedSec += duration;
 songIndex++;
 }

 return {
 nombre,
 items,
 estimatedDurationMin: Math.round(accumulatedSec / 60)
 };
}
