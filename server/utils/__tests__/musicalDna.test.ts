// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { computeMusicalDna } from '../musicalDna';

describe('computeMusicalDna', () => {
  it('promedia el bpm y elige la tonalidad y el género más repetidos del repertorio', () => {
    const dna = computeMusicalDna(
      [
        { bpm: 120, tonalidad: 'Mi', genero: 'Ska' },
        { bpm: 130, tonalidad: 'Mi', genero: 'Ska' },
        { bpm: 100, tonalidad: 'La', genero: 'Reggae' },
      ],
      '',
      []
    );

    expect(dna.bpmSuggested).toBe(117); // (120+130+100)/3 = 116.67 -> 117
    expect(dna.tonalidadSuggested).toBe('Mi');
    expect(dna.generoDominante).toBe('Ska');
    expect(dna.sampleSize).toBe(3);
  });

  it('mapea el género dominante al patrón de batería más cercano soportado por el sintetizador', () => {
    expect(computeMusicalDna([{ genero: 'Ska Punk' }], '', []).drumPatternSuggested).toBe('ska');
    expect(computeMusicalDna([{ genero: 'Cumbia Villera' }], '', []).drumPatternSuggested).toBe('cumbia');
    expect(computeMusicalDna([{ genero: 'Reggae Roots' }], '', []).drumPatternSuggested).toBe('reggae');
    expect(computeMusicalDna([{ genero: 'Hardcore Punk' }], '', []).drumPatternSuggested).toBe('punk');
    expect(computeMusicalDna([{ genero: 'Algo Inventado' }], '', []).drumPatternSuggested).toBe('rock');
  });

  it('sin canciones, cae en valores por defecto pero usa el estilo de la banda si existe', () => {
    const dna = computeMusicalDna([], 'Funk', []);
    expect(dna.bpmSuggested).toBe(120);
    expect(dna.tonalidadSuggested).toBe('La');
    expect(dna.generoDominante).toBe('Funk');
    expect(dna.drumPatternSuggested).toBe('funk');
    expect(dna.sampleSize).toBe(0);
  });

  it('extrae la instrumentación real de los miembros reutilizando parseInstruments', () => {
    const dna = computeMusicalDna(
      [],
      '',
      [
        { name: 'Jon', instrument: 'Voz, Guitarra' },
        { name: 'Elyar', instrument: 'Percusión' },
      ]
    );
    expect(dna.instrumentos).toEqual(['Voz', 'Guitarra', 'Percusión']);
  });
});
