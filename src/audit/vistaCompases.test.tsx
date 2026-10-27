import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VistaCompases } from '../components/chords/VistaCompases';
import { AjusteCompases } from '../components/atril/AjusteCompases';
import type { Cuadricula } from '../utils/cuadriculaCompases';

const compas = (n: number, acordes: string[], bloque: number) => ({ n, t0: (n - 1) * 2, t1: n * 2, bloque, acordes });
const cuadricula: Cuadricula = {
  bpm: 120, tiemposPorCompas: 4, duracionPulso: 0.5, inicioRejilla: 0, calidad: 0.9, aproximada: false,
  compases: [compas(1, ['E', 'E', 'A', 'A'], 0), compas(2, ['D', 'D', 'D', 'D'], 0), compas(3, ['E', 'E', 'E', 'E'], 1), compas(4, ['E', 'B7', 'B7', 'B7'], 1)],
  bloques: [{ indice: 0, letra: 'A', desde: 1, hasta: 2, t0: 0, t1: 4 }, { indice: 1, letra: 'B', desde: 3, hasta: 4, t0: 4, t1: 8 }],
};

describe('VistaCompases', () => {
  const html = renderToStaticMarkup(
    <VistaCompases cuadricula={cuadricula} letras={['toca igual', 'se revienta', '', 'producción']} nombre={(a) => a} audioRef={{ current: null }} isPlaying={false} tiempo={2.6} onIr={() => {}} />,
  );

  it('una casilla por tiempo, numeradas y con salto directo por sección', () => {
    expect((html.match(/aria-label="Compás \d+, tiempo/g) ?? []).length).toBe(16);
    expect(html).toContain('aria-label="Secciones"');
    expect(html).toContain('Compás 2 de 4');
  });

  it('el tiempo que suena va iluminado con el acento del módulo y su compás en suave', () => {
    // t = 2,6 s → compás 2, tiempo 2
    expect(html).toMatch(/aria-label="Compás 2, tiempo 2: D"[^>]*class="[^"]*bg-\[var\(--acc\)\]\/45/);
    expect(html).toMatch(/aria-label="Compás 2, tiempo 1: D"[^>]*class="[^"]*bg-\[var\(--acc-soft\)\]/);
  });

  it('el nombre del acorde se extiende hasta el siguiente cambio y las secciones repetidas se numeran', () => {
    expect(html).toContain('grid-column:1 / span 2'); // E en los tiempos 1-2 del compás 1
    expect(html).toContain('grid-column:2 / span 3'); // B7 del compás 4
  });

  it('la letra va debajo de su compás', () => {
    expect(html).toContain('se revienta');
    expect(html).toContain('producción');
  });

  it('sin bordes y solo tokens de color', () => {
    expect(html).not.toMatch(/\bborder/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});

describe('AjusteCompases', () => {
  const html = renderToStaticMarkup(
    <AjusteCompases cuadricula={cuadricula} ajuste={{ bpm: 100 }} onAjuste={() => {}} audioRef={{ current: null }} />,
  );

  it('ofrece las correcciones rápidas y restablecer cuando hay ajuste', () => {
    for (const t of ['Tap', 'Compás 1 aquí', '½×', '2×', '4/4 → 3/4', 'Restablecer']) expect(html).toContain(t);
  });

  it('sin bordes ni hexadecimales', () => {
    expect(html).not.toMatch(/\bborder/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
