import { describe, it, expect } from 'vitest';
import { SAMPLE_REPERTOIRE_SONGS, getSampleRepertoireForNewBand } from '../sampleRepertoire';

describe('sampleRepertoire', () => {
  it('devuelve la lista de canciones de ejemplo preconfiguradas', () => {
    expect(SAMPLE_REPERTOIRE_SONGS).toBeDefined();
    expect(SAMPLE_REPERTOIRE_SONGS.length).toBeGreaterThan(0);
    expect(SAMPLE_REPERTOIRE_SONGS[0].titulo).toBe('Brisa y Cacharros');
  });

  it('genera canciones personalizadas con el nombre de la banda', () => {
    const customSongs = getSampleRepertoireForNewBand('Los Vipers');
    expect(customSongs.length).toBe(SAMPLE_REPERTOIRE_SONGS.length);
    expect(customSongs[0].id).toContain('los-vipers');
  });
});
