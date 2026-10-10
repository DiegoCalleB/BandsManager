import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { acotarBpm, BPM_MIN, BPM_MAX } from '../hooks/useMetronomo';
import { leerAtril } from './leerAtril';

const leer = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('Metrónomo en el Atril', () => {
  it('acota el BPM al rango útil y tolera basura', () => {
    expect(acotarBpm(10)).toBe(BPM_MIN);
    expect(acotarBpm(999)).toBe(BPM_MAX);
    expect(acotarBpm(120.4)).toBe(120);
    expect(acotarBpm(NaN)).toBe(120);
  });

  it('el Atril usa el hook con el tempo de la canción y el control compartido', () => {
    const atril = leerAtril();
    expect(atril).toContain('useMetronomo(song.bpm || 120)');
    expect(atril).toContain('<ControlMetronomo metronomo={metronomo} />');
  });

  it('el hook reutiliza el clic único del producto', () => {
    expect(leer('../hooks/useMetronomo.ts')).toContain("from '../utils/clicMetronomo'");
  });
});
