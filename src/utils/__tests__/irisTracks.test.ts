// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { getSongIrisStemIdea, hasIrisStems, getIdeaTracks } from '../irisTracks';
import { Song, SongAudioIdea } from '../../types';

describe('irisTracks helpers', () => {
  it('returns null when song has no audioIdeas', () => {
    const song: Song = {
      id: 'song-1',
      titulo: 'Test Song',
      duracion: '3:00',
      duracionSegundos: 180,
      tonalidad: 'Am',
      bpm: 120
    };
    expect(getSongIrisStemIdea(song)).toBeNull();
    expect(hasIrisStems(song)).toBe(false);
  });

  it('detects Iris stems when idea has multiple pistas', () => {
    const ideaWithStems: SongAudioIdea = {
      id: 'idea-1',
      titulo: 'Mezcla Iris',
      seccion: 'general',
      audioUrl: 'https://example.com/master.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15',
      pistas: [
        { id: 'track-1', nombre: 'Voz', audioUrl: 'https://example.com/vocal.mp3' },
        { id: 'track-2', nombre: 'Batería', audioUrl: 'https://example.com/drums.mp3' }
      ]
    };
    const song: Song = {
      id: 'song-1',
      titulo: 'Test Song',
      duracion: '3:00',
      duracionSegundos: 180,
      tonalidad: 'Am',
      bpm: 120,
      audioIdeas: [ideaWithStems]
    };
    expect(hasIrisStems(song)).toBe(true);
    expect(getSongIrisStemIdea(song)?.id).toBe('idea-1');
    expect(getIdeaTracks(ideaWithStems)).toHaveLength(2);
  });

  it('detects Iris stems when stemEngineUsed is set', () => {
    const ideaWithEngine: SongAudioIdea = {
      id: 'idea-engine',
      titulo: 'Pistas Iris',
      seccion: 'general',
      audioUrl: 'https://example.com/audio.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15',
      stemEngineUsed: 'demucs-v4'
    };
    const song: Song = {
      id: 'song-2',
      titulo: 'Another Song',
      duracion: '4:00',
      duracionSegundos: 240,
      tonalidad: 'C',
      bpm: 100,
      audioIdeas: [ideaWithEngine]
    };
    expect(hasIrisStems(song)).toBe(true);
    expect(getSongIrisStemIdea(song)?.id).toBe('idea-engine');
  });

  it('returns fallback track when idea has no pistas', () => {
    const singleIdea: SongAudioIdea = {
      id: 'idea-single',
      titulo: 'Maqueta Acústica',
      seccion: 'general',
      audioUrl: 'https://example.com/acoustic.mp3',
      subidoPor: 'diego',
      fecha: '2026-09-15'
    };
    const tracks = getIdeaTracks(singleIdea);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].nombre).toBe('Maqueta Acústica');
    expect(tracks[0].audioUrl).toBe('https://example.com/acoustic.mp3');
  });
});
