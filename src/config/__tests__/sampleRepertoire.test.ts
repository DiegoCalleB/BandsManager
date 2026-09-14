import { describe, it, expect } from 'vitest';
import { SAMPLER_SONGS, SAMPLER_SETLISTS, SAMPLER_ALBUM_NAME, SAMPLER_COVER_URL } from '../sampleRepertoire';
import fs from 'fs';
import path from 'path';

describe('sampleRepertoire config and assets', () => {
  it('defines 5 royalty-free sample tracks', () => {
    expect(SAMPLER_SONGS).toHaveLength(5);
    expect(SAMPLER_SONGS.map(s => s.ordenAlbum)).toEqual([1, 2, 3, 4, 5]);
  });

  it('all tracks belong to the Sampler EP album', () => {
    for (const song of SAMPLER_SONGS) {
      expect(song.albumDisco).toBe(SAMPLER_ALBUM_NAME);
      expect(song.portadaUrl).toBe(SAMPLER_COVER_URL);
      expect(song.audioPrincipalUrl).toBeDefined();
      expect(song.estadoTema).toBe('listo');
      expect(song.energia).toBeGreaterThan(0);
    }
  });

  it('all referenced mp3 and cover assets physically exist in /public', () => {
    const publicDir = path.resolve(__dirname, '../../../public');
    
    // Check cover SVG
    const coverPath = path.join(publicDir, SAMPLER_COVER_URL.replace(/^\//, ''));
    expect(fs.existsSync(coverPath)).toBe(true);

    // Check all 5 MP3 audio files
    for (const song of SAMPLER_SONGS) {
      const audioRel = song.audioPrincipalUrl!.replace(/^\//, '');
      const audioPath = path.join(publicDir, audioRel);
      expect(fs.existsSync(audioPath)).toBe(true);
      const stat = fs.statSync(audioPath);
      expect(stat.size).toBeGreaterThan(10000); // Verify valid audio file size
    }
  });

  it('defines a showcase sample setlist containing all 5 tracks', () => {
    expect(SAMPLER_SETLISTS).toHaveLength(1);
    const setlist = SAMPLER_SETLISTS[0];
    expect(setlist.id).toBe('setlist-sample-1');
    expect(setlist.items.length).toBeGreaterThanOrEqual(5);

    const songItems = setlist.items.filter(i => i.tipoItem === 'cancion');
    expect(songItems.map(i => i.songId)).toEqual([
      'sample-track-1',
      'sample-track-2',
      'sample-track-3',
      'sample-track-4',
      'sample-track-5'
    ]);
  });
});
