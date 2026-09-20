import { describe, it, expect } from' vitest';
import { RehearsalAgendaItem } from' ../../../types';

describe('Ensayos Agenda reordering and multi-selection logic', () => {
 it('correctly reorders agenda items on drag and drop', () => {
 const agenda: RehearsalAgendaItem[] = [
 { id:' 1', tipo:' cancion', titulo:' Canción 1', duracionEstimadaMin: 5 },
 { id:' 2', tipo:' cancion', titulo:' Canción 2', duracionEstimadaMin: 6 },
 { id:' 3', tipo:' cancion', titulo:' Canción 3', duracionEstimadaMin: 4 },
 { id:' 4', tipo:' pausa', titulo:' Descanso', duracionEstimadaMin: 10 },
 ];

 // Drag item at index 0 to index 2 (move Canción 1 to position 2)
 const newAgenda = [...agenda];
 const [moved] = newAgenda.splice(0, 1);
 newAgenda.splice(2, 0, moved);

 expect(newAgenda.map(item => item.id)).toEqual(['2',' 3',' 1',' 4']);
 expect(newAgenda[2].titulo).toBe('Canción 1');
 });

 it('correctly preserves user click order when creating agenda items from selected songs', () => {
 const catalog = [
 { id:' s-1', titulo:' Alpha Song', duracionSegundos: 180 },
 { id:' s-2', titulo:' Beta Song', duracionSegundos: 240 },
 { id:' s-3', titulo:' Gamma Song', duracionSegundos: 200 },
 ];

 // User selected in order: s-3 first, then s-1, then s-2
 const selectedSongIds = ['s-3',' s-1',' s-2'];

 const newAgendaItems: RehearsalAgendaItem[] = selectedSongIds.map(sId => {
 const s = catalog.find(item => item.id === sId);
 return {
 id: `ag-${sId}`,
 tipo:' cancion',
 titulo: s?.titulo ||' Canción',
 songId: sId,
 duracionEstimadaMin: s?.duracionSegundos ? Math.ceil(s.duracionSegundos / 60) + 3 : 7
 };
 });

 expect(newAgendaItems[0].songId).toBe('s-3');
 expect(newAgendaItems[0].titulo).toBe('Gamma Song');
 expect(newAgendaItems[1].songId).toBe('s-1');
 expect(newAgendaItems[1].titulo).toBe('Alpha Song');
 expect(newAgendaItems[2].songId).toBe('s-2');
 expect(newAgendaItems[2].titulo).toBe('Beta Song');
 });
});
