import { describe, it, expect } from' vitest';
import { formatTime } from' ../EnsayoCronometro';
import { processChordText, extractUniqueChords } from' ../../../utils/chordUtils';

describe('Ensayos & Local en Vivo utilities', () => {
 it('correctly formats stopwatch seconds into MM:SS and HH:MM:SS', () => {
 expect(formatTime(0)).toBe('00:00');
 expect(formatTime(65)).toBe('01:05');
 expect(formatTime(3600)).toBe('01:00:00');
 expect(formatTime(3665)).toBe('01:01:05');
 });

 it('correctly extracts unique chords from chord sheet text', () => {
 const rawChordSheet = `
[Intro]
Lam Fa Sol Lam
[Estribillo]
Do Sol Rem Lam
Fa Sol Lam
 `;
 const uniqueChords = extractUniqueChords(rawChordSheet);
 expect(uniqueChords).toContain('Lam');
 expect(uniqueChords).toContain('Fa');
 expect(uniqueChords).toContain('Sol');
 expect(uniqueChords).toContain('Do');
 expect(uniqueChords).toContain('Rem');
 });

 it('correctly processes and transposes chord lines', () => {
 const chordLine =' Lam Fa Sol';
 const transposed = processChordText(chordLine, 2,' ES');
 expect(transposed).toContain('Sim');
 expect(transposed).toContain('Sol');
 expect(transposed).toContain('La');
 });
});
