import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bpmDeToques } from '../hooks/useMetronomo';

const ensayo = readFileSync(new URL('../components/ensayos/ModoLocalEnVivoTab.tsx', import.meta.url), 'utf8');

describe('metrónomo único del producto', () => {
  it('tap tempo: media de los intervalos y descarte de lo imposible', () => {
    expect(bpmDeToques([0])).toBeNull();
    expect(bpmDeToques([0, 500, 1000, 1500])).toBe(120);
    expect(bpmDeToques([0, 600, 1200])).toBe(100);
    expect(bpmDeToques([0, 10])).toBeNull(); // 6000 bpm
    expect(bpmDeToques([0, 5000])).toBeNull(); // 12 bpm
  });

  it('el visor de ensayo usa useMetronomo y no programa clics a mano', () => {
    expect(ensayo).toContain('useMetronomo(currentSong?.bpm || 120, beatsPerBar)');
    expect(ensayo).toContain('metronomo.tocarTempo');
    expect(ensayo).not.toContain('programarClic');
    expect(ensayo).not.toContain('new AudioCtx()');
  });
});
