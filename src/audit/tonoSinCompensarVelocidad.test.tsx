import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const panel = readFileSync(new URL('../components/PracticeModePanel.tsx', import.meta.url), 'utf8');

describe('tono y velocidad en el modo práctica', () => {
  it('no compensa la velocidad en el tono: el navegador ya conserva el tono con playbackRate', () => {
    expect(panel).not.toContain('Math.log2(speed)');
    expect(panel).not.toContain('effectiveSemitones');
    expect(panel).toContain('semitones={semitonesOffset}');
    expect(panel).not.toMatch(/preservesPitch\s*=\s*false/);
  });
});
