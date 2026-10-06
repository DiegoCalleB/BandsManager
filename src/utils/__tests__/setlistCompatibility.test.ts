// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { calcularCosteTransicion, costeTotalTransiciones, optimizarOrdenPorTransiciones, sugerirMejorPuntoParaChapa, HuecoCancion } from '../setlistCompatibility';
import { Song, SetlistItem } from '../../types';

function song(id: string, overrides: Partial<Song> = {}): Song {
  return { id, titulo: id, duracionSegundos: 200, energia: 10, ...overrides };
}

function slot(s: Song): HuecoCancion {
  const item: SetlistItem = { id: `item-${s.id}`, tipoItem: 'cancion', songId: s.id };
  return { item, song: s };
}

describe('calcularCosteTransicion', () => {
  it('misma tonalidad, mismo BPM, misma energía: coste cero', () => {
    const a = song('a', { tonalidad: 'Am', bpm: 120, energia: 10 });
    const b = song('b', { tonalidad: 'Am', bpm: 120, energia: 10 });
    expect(calcularCosteTransicion(a, b).total).toBe(0);
  });

  it('choque armónico + salto grande de BPM + salto grande de energía: coste cerca del máximo', () => {
    // Do (C) y Fa#/Gb están en las antípodas del círculo de quintas: choque real.
    const a = song('a', { tonalidad: 'C', bpm: 80, energia: 4 });
    const b = song('b', { tonalidad: 'F#', bpm: 180, energia: 20 });
    const coste = calcularCosteTransicion(a, b);
    expect(coste.harmonyRelation).toBe('choque');
    expect(coste.total).toBeGreaterThan(0.7);
  });

  it('sin BPM o tonalidad detectados en alguna de las dos, no revienta ni inventa un choque', () => {
    const a = song('a', {});
    const b = song('b', { tonalidad: 'Am', bpm: 120 });
    const coste = calcularCosteTransicion(a, b);
    expect(coste.harmonyRelation).toBe('desconocida');
    expect(Number.isFinite(coste.total)).toBe(true);
    expect(coste.total).toBeGreaterThanOrEqual(0);
    expect(coste.total).toBeLessThanOrEqual(1);
  });

  it('el coste total nunca se sale de 0-1', () => {
    const a = song('a', { tonalidad: 'C', bpm: 40, energia: 1 });
    const b = song('b', { tonalidad: 'F#', bpm: 300, energia: 20 });
    const coste = calcularCosteTransicion(a, b);
    expect(coste.total).toBeGreaterThanOrEqual(0);
    expect(coste.total).toBeLessThanOrEqual(1);
  });
});

describe('optimizarOrdenPorTransiciones', () => {
  it('nunca mueve la primera canción (apertura elegida por el usuario)', () => {
    const songs = [
      song('apertura', { tonalidad: 'C', bpm: 120, energia: 15 }),
      song('lejos1', { tonalidad: 'F#', bpm: 70, energia: 3 }),
      song('cerca', { tonalidad: 'C', bpm: 122, energia: 14 }),
      song('lejos2', { tonalidad: 'B', bpm: 200, energia: 20 })
    ];
    const orden = optimizarOrdenPorTransiciones(songs.map(slot));
    expect(orden[0].song.id).toBe('apertura');
  });

  it('el coste total del orden optimizado nunca es peor que el orden original', () => {
    const songs = [
      song('s1', { tonalidad: 'C', bpm: 90, energia: 6 }),
      song('s2', { tonalidad: 'F#', bpm: 190, energia: 20 }),
      song('s3', { tonalidad: 'Am', bpm: 95, energia: 7 }),
      song('s4', { tonalidad: 'G', bpm: 130, energia: 14 }),
      song('s5', { tonalidad: 'B', bpm: 175, energia: 19 }),
      song('s6', { tonalidad: 'Em', bpm: 100, energia: 8 })
    ];
    const original = songs.map(slot);
    const optimizado = optimizarOrdenPorTransiciones(original);
    expect(costeTotalTransiciones(optimizado)).toBeLessThanOrEqual(costeTotalTransiciones(original) + 1e-9);
  });

  it('agrupa temas de tonalidad/tempo compatibles en vez de dejarlos dispersos', () => {
    // s1 (apertura) y s2 comparten tonalidad/tempo — deberían acabar adyacentes tras optimizar,
    // aunque en el orden original estén separados por temas muy distintos.
    const s1 = song('s1', { tonalidad: 'C', bpm: 120, energia: 12 });
    const s2 = song('s2', { tonalidad: 'C', bpm: 121, energia: 13 });
    const distinto1 = song('d1', { tonalidad: 'F#', bpm: 70, energia: 2 });
    const distinto2 = song('d2', { tonalidad: 'B', bpm: 200, energia: 20 });
    const original = [s1, distinto1, distinto2, s2].map(slot);
    const optimizado = optimizarOrdenPorTransiciones(original);
    const idxS1 = optimizado.findIndex((h) => h.song.id === 's1');
    const idxS2 = optimizado.findIndex((h) => h.song.id === 's2');
    expect(Math.abs(idxS1 - idxS2)).toBe(1);
  });

  it('con 2 o menos canciones, devuelve el mismo orden sin tocarlo', () => {
    const songs = [song('a'), song('b')];
    const orden = optimizarOrdenPorTransiciones(songs.map(slot));
    expect(orden.map((h) => h.song.id)).toEqual(['a', 'b']);
  });
});

describe('sugerirMejorPuntoParaChapa', () => {
  it('sugiere insertar justo tras la canción de la peor transición', () => {
    const s1 = song('s1', { tonalidad: 'C', bpm: 120, energia: 12 });
    const s2 = song('s2', { tonalidad: 'C', bpm: 121, energia: 13 }); // transición suave con s1
    const s3 = song('s3', { tonalidad: 'F#', bpm: 190, energia: 20 }); // choque real con s2
    const items: SetlistItem[] = [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i2', tipoItem: 'cancion', songId: 's2' },
      { id: 'i3', tipoItem: 'cancion', songId: 's3' }
    ];
    const sugerencia = sugerirMejorPuntoParaChapa(items, [s1, s2, s3]);
    expect(sugerencia).not.toBeNull();
    expect(sugerencia!.insertAfterItemId).toBe('i2');
    expect(sugerencia!.cancionAntes).toBe('s2');
    expect(sugerencia!.cancionDespues).toBe('s3');
  });

  it('no sugiere nada si todas las transiciones ya son suaves', () => {
    const s1 = song('s1', { tonalidad: 'C', bpm: 120, energia: 12 });
    const s2 = song('s2', { tonalidad: 'C', bpm: 122, energia: 13 });
    const s3 = song('s3', { tonalidad: 'G', bpm: 124, energia: 14 });
    const items: SetlistItem[] = [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i2', tipoItem: 'cancion', songId: 's2' },
      { id: 'i3', tipoItem: 'cancion', songId: 's3' }
    ];
    expect(sugerirMejorPuntoParaChapa(items, [s1, s2, s3])).toBeNull();
  });

  it('nunca sugiere un par ya separado por un bloque existente', () => {
    const s1 = song('s1', { tonalidad: 'C', bpm: 80, energia: 4 });
    const s2 = song('s2', { tonalidad: 'F#', bpm: 200, energia: 20 }); // choque brutal, pero ya hay una chapa entre medias
    const items: SetlistItem[] = [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i-chapa', tipoItem: 'bloque', bloqueSubtipo: 'chapa' },
      { id: 'i2', tipoItem: 'cancion', songId: 's2' }
    ];
    expect(sugerirMejorPuntoParaChapa(items, [s1, s2])).toBeNull();
  });
});
