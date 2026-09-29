import { describe, it, expect } from 'vitest';
import { formatSongTitle, normalizeSongTitlesInList } from '../formatSongTitle';
import { Song } from '../../types';

describe('formatSongTitle', () => {
  it('converts all-uppercase song titles to proper title case (nombres propios)', () => {
    expect(formatSongTitle('SOME KIND OF WONDERFUL')).toBe('Some Kind Of Wonderful');
    expect(formatSongTitle('LONG TRAIN RUNNIN')).toBe('Long Train Runnin');
    expect(formatSongTitle('AL RIGHT NOW')).toBe('Al Right Now');
    expect(formatSongTitle('BORN TO BE WILD')).toBe('Born To Be Wild');
  });

  it('converts all-lowercase song titles to proper title case', () => {
    expect(formatSongTitle('born to be wild')).toBe('Born To Be Wild');
    expect(formatSongTitle('have you ever seen the rain')).toBe('Have You Ever Seen The Rain');
    expect(formatSongTitle('crossroads')).toBe('Crossroads');
  });

  it('handles mixed case and preserves punctuation and parentheses', () => {
    expect(formatSongTitle('Me has cazado (you really got ...')).toBe('Me Has Cazado (You Really Got ...');
    expect(formatSongTitle('Going Down')).toBe('Going Down');
    expect(formatSongTitle('la flaca (acústico en vivo)')).toBe('La Flaca (Acústico En Vivo)');
  });

  it('preserves Roman numerals', () => {
    expect(formatSongTitle('symphony no. 5: part II')).toBe('Symphony No. 5: Part II');
    expect(formatSongTitle('CONCERTO IN D MINOR, VOL. IV')).toBe('Concerto In D Minor, Vol. IV');
  });

  it('preserves collaborations like feat. and ft.', () => {
    expect(formatSongTitle('CANCIÓN DEL PIRATA (FEAT. ROBERTO)')).toBe('Canción Del Pirata (feat. Roberto)');
    expect(formatSongTitle('highway to hell ft. guest')).toBe('Highway To Hell ft. Guest');
  });

  it('handles words with apostrophes and accents', () => {
    expect(formatSongTitle("don't stop believin'")).toBe("Don't Stop Believin'");
    expect(formatSongTitle("rock'n' roll")).toBe("Rock'N' Roll");
    expect(formatSongTitle('CANCIONES Y SUEÑOS')).toBe('Canciones Y Sueños');
  });

  it('handles empty, null or undefined values gracefully', () => {
    expect(formatSongTitle('')).toBe('');
    expect(formatSongTitle(null as any)).toBe('');
    expect(formatSongTitle(undefined as any)).toBe('');
    expect(formatSongTitle('')).toBe('');
  });
});

describe('normalizeSongTitlesInList', () => {
  it('normalizes song titles across an array of songs', () => {
    const mockSongs: Song[] = [
      { id: '1', titulo: 'SOME KIND OF WONDERFUL', duracion: '3:30', tonalidad: 'D', band_id: 'b1' },
      { id: '2', titulo: 'Born to be wild', duracion: '3:33', tonalidad: 'E', band_id: 'b1' },
      { id: '3', titulo: 'Going Down', duracion: '3:30', tonalidad: 'D', band_id: 'b1' },
    ];

    const { updatedSongs, changedCount } = normalizeSongTitlesInList(mockSongs);

    expect(changedCount).toBe(2);
    expect(updatedSongs[0].titulo).toBe('Some Kind Of Wonderful');
    expect(updatedSongs[1].titulo).toBe('Born To Be Wild');
    expect(updatedSongs[2].titulo).toBe('Going Down');
  });
});
