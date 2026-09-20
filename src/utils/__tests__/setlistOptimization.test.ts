import { describe, it, expect } from' vitest';
import {
 calculateSetlistDurationSec,
 findBestSetlistMatch,
 generateAutoSetlistForConcert
} from' ../setlistOptimization';
import { Setlist, Song } from' ../../types';

describe('setlistOptimization: Cálculo y sugerencia inteligente de setlist para bolos', () => {
 const mockSongs: Song[] = [
 { id:' s1', titulo:' Tema Rápido', duracionSegundos: 180, energia: 20 },
 { id:' s2', titulo:' Balada', duracionSegundos: 240, energia: 6 },
 { id:' s3', titulo:' Tema Medio', duracionSegundos: 300, energia: 12 },
 { id:' s4', titulo:' Hit Festival', duracionSegundos: 210, energia: 18, favoritoGeneral: true }
 ];

 const setlist45Min: Setlist = {
 id:' st-45',
 nombre:' Setlist Festival 45m',
 tipoFormato:' festival',
 fechaCreacion:' 2026-01-01',
 fechaUltimaEdicion:' 2026-01-01',
 items: [
 { id:' i1', tipoItem:' cancion', songId:' s1' }, // 3m
 { id:' i2', tipoItem:' cancion', songId:' s4' }, // 3.5m
 { id:' i3', tipoItem:' bloque', bloqueSubtipo:' presentacion', duracionEstimadaMinutos: 2 }, // 2m
 { id:' i4', tipoItem:' cancion', songId:' s3' }, // 5m
 { id:' i5', tipoItem:' cancion', songId:' s2' } // 4m -> Total ~ 17.5 min
 ]
 };

 const setlist75Min: Setlist = {
 id:' st-75',
 nombre:' Setlist Sala 75m',
 tipoFormato:' sala_larga',
 fechaCreacion:' 2026-01-01',
 fechaUltimaEdicion:' 2026-01-01',
 items: new Array(15).fill(null).map((_, idx) => ({
 id: `it-${idx}`,
 tipoItem:' cancion',
 songId:' s3' // 5 min * 15 = 75 min
 }))
 };

 it('calcula la duración en segundos considerando canciones y bloques', () => {
 const totalSec = calculateSetlistDurationSec(setlist45Min, mockSongs);
 // 180 + 210 + 120 + 300 + 240 = 1050s = 17.5 min
 expect(totalSec).toBe(1050);
 });

 it('selecciona el setlist que mejor coincide con la duración pactada', () => {
 const match = findBestSetlistMatch([setlist45Min, setlist75Min], mockSongs, 75,' sala');
 expect(match).not.toBeNull();
 expect(match?.setlist.id).toBe('st-75');
 expect(match?.durationMin).toBe(75);
 expect(match?.differenceMin).toBe(0);
 });

 it('prioriza el formato festival cuando el bolo es un festival', () => {
 const match = findBestSetlistMatch([setlist45Min, setlist75Min], mockSongs, 20,' festival');
 expect(match).not.toBeNull();
 expect(match?.setlist.id).toBe('st-45');
 });

 it('genera un setlist automático respetando el tiempo objetivo', () => {
 const autoSetlist = generateAutoSetlistForConcert('Sala Caracol', 10, mockSongs, false);
 expect(autoSetlist.nombre).toContain('Sala Caracol');
 expect(autoSetlist.items.length).toBeGreaterThan(0);
 expect(autoSetlist.estimatedDurationMin).toBeGreaterThanOrEqual(8);
 });
});
