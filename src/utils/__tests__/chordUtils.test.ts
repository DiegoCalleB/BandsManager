import { describe, it, expect } from 'vitest';
import {
  parseRootNote,
  transposeSingleNote,
  transposeChordToken,
  processChordText,
  extractUniqueChords,
  keyToChromaticIndex,
  getSemitoneDifference
} from '../chordUtils';

describe('chordUtils', () => {
  describe('parseRootNote', () => {
    it('parses Spanish root notes correctly', () => {
      expect(parseRootNote('Do')).toEqual({ root: 'Do', suffix: '' });
      expect(parseRootNote('Sol#m')).toEqual({ root: 'Sol#', suffix: 'm' });
      expect(parseRootNote('Re7')).toEqual({ root: 'Re', suffix: '7' });
      expect(parseRootNote('Sib')).toEqual({ root: 'Sib', suffix: '' });
      expect(parseRootNote('Fa#m')).toEqual({ root: 'Fa#', suffix: 'm' });
    });

    it('parses English root notes correctly', () => {
      expect(parseRootNote('C')).toEqual({ root: 'C', suffix: '' });
      expect(parseRootNote('G#m')).toEqual({ root: 'G#', suffix: 'm' });
      expect(parseRootNote('D7')).toEqual({ root: 'D', suffix: '7' });
      expect(parseRootNote('Bbmaj7')).toEqual({ root: 'Bb', suffix: 'maj7' });
    });

    it('returns null for non-chords', () => {
      expect(parseRootNote('Hola')).toBeNull();
      expect(parseRootNote('123')).toBeNull();
    });

    it('rejects English words that merely start with a root note letter', () => {
      // "Get", "Fire", "Baby", "Come", "Back" all start with A-G but are not chords -
      // regression test for the bug where any word starting with a note letter counted
      // as a chord and English lyrics got mangled into fake chord lines.
      expect(parseRootNote('Get')).toBeNull();
      expect(parseRootNote('Fire')).toBeNull();
      expect(parseRootNote('Baby')).toBeNull();
      expect(parseRootNote('Come')).toBeNull();
      expect(parseRootNote('Back')).toBeNull();
      expect(parseRootNote('Days')).toBeNull();
    });

    it('accepts real chords with recognized suffixes and slash bass notes', () => {
      expect(parseRootNote('Am7')).toEqual({ root: 'A', suffix: 'm7' });
      expect(parseRootNote('Csus4')).toEqual({ root: 'C', suffix: 'sus4' });
      expect(parseRootNote('C/G')).toEqual({ root: 'C', suffix: '/G' });
      expect(parseRootNote('Sol/Si')).toEqual({ root: 'Sol', suffix: '/Si' });
    });

    it('rejects a slash chord with an invalid bass note', () => {
      expect(parseRootNote('C/Get')).toBeNull();
    });
  });

  describe('transposeSingleNote', () => {
    it('transposes English notes by semitones', () => {
      expect(transposeSingleNote('C', 2, 'EN')).toBe('D');
      expect(transposeSingleNote('C', 1, 'EN')).toBe('C#');
      expect(transposeSingleNote('A', 3, 'EN')).toBe('C');
      expect(transposeSingleNote('B', 1, 'EN')).toBe('C');
    });

    it('transposes Spanish notes by semitones', () => {
      expect(transposeSingleNote('Do', 2, 'ES')).toBe('Re');
      expect(transposeSingleNote('Do', 1, 'ES')).toBe('Do#');
      expect(transposeSingleNote('La', 3, 'ES')).toBe('Do');
      expect(transposeSingleNote('Si', 1, 'ES')).toBe('Do');
    });

    it('converts between English and Spanish notations when semitones is 0', () => {
      expect(transposeSingleNote('C', 0, 'ES')).toBe('Do');
      expect(transposeSingleNote('Do', 0, 'EN')).toBe('C');
      expect(transposeSingleNote('G#', 0, 'ES')).toBe('Sol#');
    });
  });

  describe('transposeChordToken', () => {
    it('transposes simple chords', () => {
      expect(transposeChordToken('Am', 2, 'EN')).toBe('Bm');
      expect(transposeChordToken('Lam', 2, 'ES')).toBe('Sim');
    });

    it('handles slash / bass chords', () => {
      expect(transposeChordToken('C/G', 2, 'EN')).toBe('D/A');
      expect(transposeChordToken('Do/Sol', 2, 'ES')).toBe('Re/La');
    });
  });

  describe('processChordText', () => {
    it('transposes bracketed inline chords in song lyrics', () => {
      const text = 'Siento que el [Do]ritmo vuelve a [Sol]sonar en [Lam]mi mente';
      const result = processChordText(text, 2, 'ES');
      expect(result).toBe('Siento que el [Re]ritmo vuelve a [La]sonar en [Sim]mi mente');
    });

    it('transposes standalone chord lines', () => {
      const text = 'Do      Sol     Lam\nEsta es la letra de la canción';
      const result = processChordText(text, 2, 'ES');
      expect(result).toContain('Re');
      expect(result).toContain('La');
      expect(result).toContain('Sim');
      expect(result).toContain('Esta es la letra de la canción');
    });
  });

  describe('extractUniqueChords', () => {
    it('extracts all unique bracketed chords from text', () => {
      const text = '[Do] intro [Sol] verse [Do] chorus [Lam] bridge';
      const chords = extractUniqueChords(text);
      expect(chords).toEqual(['Do', 'Sol', 'Lam']);
    });

    it('does not mistake capitalized English lyrics for a chord line', () => {
      // Regression test: title-case English lyrics like this used to be flagged as a
      // 100% chord line because every word happened to start with a root note letter.
      const text = 'Baby Come Back\nGet your motor runnin\'';
      expect(extractUniqueChords(text)).toEqual([]);
    });

    it('still extracts a real standalone chord line mixed with English lyrics', () => {
      const text = 'Am F C G\nGet your motor runnin\'';
      expect(extractUniqueChords(text)).toEqual(['Am', 'F', 'C', 'G']);
    });
  });

  describe('keyToChromaticIndex', () => {
    it('gives the same index for English and Spanish spellings of the same note', () => {
      expect(keyToChromaticIndex('E')).toBe(keyToChromaticIndex('Mi'));
      expect(keyToChromaticIndex('D')).toBe(keyToChromaticIndex('Re'));
    });

    it('ignores major/minor when computing the index', () => {
      expect(keyToChromaticIndex('C')).toBe(keyToChromaticIndex('Cm'));
      expect(keyToChromaticIndex('Mi')).toBe(keyToChromaticIndex('Mim'));
    });

    it('returns null for an unrecognized key', () => {
      expect(keyToChromaticIndex('Hola')).toBeNull();
    });
  });

  describe('getSemitoneDifference', () => {
    it('computes the shortest distance between two keys, in either notation', () => {
      // E -> D is down a whole tone (-2), not up 10
      expect(getSemitoneDifference('E', 'D')).toBe(-2);
      expect(getSemitoneDifference('Mi', 'Re')).toBe(-2);
      // C -> D is up a whole tone
      expect(getSemitoneDifference('C', 'D')).toBe(2);
    });

    it('is zero for the same key', () => {
      expect(getSemitoneDifference('G', 'G')).toBe(0);
      expect(getSemitoneDifference('Sol', 'G')).toBe(0);
    });

    it('returns null when either key is unrecognized', () => {
      expect(getSemitoneDifference('Hola', 'D')).toBeNull();
      expect(getSemitoneDifference('D', 'Hola')).toBeNull();
    });
  });
});
