import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrichMissingAudioSongsForBand } from '../enrichCoversWithoutAudio.js';
import * as repertoireDb from '../../db/repertoire.js';
import * as aiModule from '../../ai.js';

describe('enrichCoversWithoutAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('procesa canciones sin audio y guarda las tonalidades y BPMs investigados', async () => {
    const mockSongs = [
      {
        id: 'song-cover-1',
        titulo: 'Proud Mary',
        band_id: 'band-ruta-66',
        esVersionCovers: true,
        tonalidad: 'Am',
        bpm: 120,
        energia: 10
      },
      {
        id: 'song-cover-2',
        titulo: 'Johnny B. Goode',
        band_id: 'band-ruta-66',
        esVersionCovers: true,
        tonalidad: 'C',
        bpm: 120,
        energia: 10
      }
    ];

    vi.spyOn(repertoireDb, 'dbGetSongs').mockResolvedValue(mockSongs as any);
    const dbUpsertSpy = vi.spyOn(repertoireDb, 'dbUpsertSong').mockResolvedValue({} as any);

    vi.spyOn(aiModule, 'getAiClient').mockReturnValue({} as any);
    vi.spyOn(aiModule, 'generateContentWithFallback').mockImplementation(async (_client: any, params: any) => {
      const promptText = params.contents?.[0]?.parts?.[0]?.text || '';
      if (promptText.includes('Proud Mary')) {
        return {
          text: JSON.stringify({
            artistaOriginal: 'Creedence Clearwater Revival',
            tonalidadOriginal: 'D',
            bpmOriginal: 121,
            energia: 16,
            generoRock: 'Roots Rock'
          })
        };
      }
      return {
        text: JSON.stringify({
          artistaOriginal: 'Chuck Berry',
          tonalidadOriginal: 'Bb',
          bpmOriginal: 168,
          energia: 19,
          generoRock: 'Rock & Roll Clásico'
        })
      };
    });

    const result = await enrichMissingAudioSongsForBand('band-ruta-66');

    expect(result.totalProcesadas).toBe(2);
    expect(result.enriquecidas).toBe(2);
    expect(dbUpsertSpy).toHaveBeenCalledTimes(2);

    const firstUpsert = dbUpsertSpy.mock.calls[0][0];
    expect(firstUpsert.tonalidad).toBe('D');
    expect(firstUpsert.bpm).toBe(121);
    expect(firstUpsert.artista).toBe('Creedence Clearwater Revival');
    expect(firstUpsert.energia).toBe(16);

    const secondUpsert = dbUpsertSpy.mock.calls[1][0];
    expect(secondUpsert.tonalidad).toBe('Bb');
    expect(secondUpsert.bpm).toBe(168);
    expect(secondUpsert.artista).toBe('Chuck Berry');
  });

  it('no procesa canciones originales con audio ya subido', async () => {
    const mockSongs = [
      {
        id: 'song-orig-1',
        titulo: 'Mi Tema Propio Grabado',
        band_id: 'band-bakandeya',
        esVersionCovers: false,
        audioPrincipalUrl: 'https://supabase.co/audio.mp3',
        tonalidad: 'Em',
        bpm: 125
      }
    ];

    vi.spyOn(repertoireDb, 'dbGetSongs').mockResolvedValue(mockSongs as any);
    const dbUpsertSpy = vi.spyOn(repertoireDb, 'dbUpsertSong').mockResolvedValue({} as any);

    const result = await enrichMissingAudioSongsForBand('band-bakandeya');

    expect(result.totalProcesadas).toBe(0);
    expect(result.enriquecidas).toBe(0);
    expect(dbUpsertSpy).not.toHaveBeenCalled();
  });
});
