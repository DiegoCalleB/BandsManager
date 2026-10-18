import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { bucleActivo, marcarExtremo, saltoDeBucle, SIN_BUCLE } from '../utils/bucleAB';
import { ControlBucle } from '../components/chords/ControlBucle';
import { leerAtril } from './leerAtril';

const leer = (r: string) => readFileSync(new URL(r, import.meta.url), 'utf8');

describe('bucle A/B compartido', () => {
  it('salta a A (o al inicio) al pasar B y no toca antes', () => {
    expect(saltoDeBucle(9.9, 4, 10)).toBeNull();
    expect(saltoDeBucle(10, 4, 10)).toBe(4);
    expect(saltoDeBucle(10, null, 10)).toBe(0);
    expect(saltoDeBucle(50, 4, null)).toBeNull();
  });

  it('marcar un extremo que invierte el bucle descarta el otro', () => {
    let b = marcarExtremo(SIN_BUCLE, 'a', 5);
    b = marcarExtremo(b, 'b', 12);
    expect(bucleActivo(b)).toBe(true);
    expect(marcarExtremo(b, 'a', 20)).toEqual({ a: 20, b: null });
    expect(marcarExtremo(b, 'b', 2)).toEqual({ a: null, b: 2 });
  });

  it('el Atril y el panel de práctica usan la misma lógica', () => {
    expect(leerAtril()).toContain('useBucleAB(audioRef, audioUrl)');
    expect(leer('../components/PracticeModePanel.tsx')).toContain('saltoDeBucle(el.currentTime, loopA, loopB)');
    expect(leer('../hooks/useBucleAB.ts')).toContain("from '../utils/bucleAB'");
  });

  it('el control pinta los extremos marcados, sin border', () => {
    const html = renderToStaticMarkup(<ControlBucle bucle={{ a: 65, b: 130 }} onMarcar={() => {}} onLimpiar={() => {}} />);
    expect(html).toContain('A 1:05');
    expect(html).toContain('B 2:10');
    expect(html).toContain('Quitar bucle');
    expect(html).not.toContain('border');
  });
});
