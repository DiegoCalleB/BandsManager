import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import React from 'react';
import { GrabarIdea } from '../components/chords/GrabarIdea';

const base = {
  segundos: 0, toma: null, offset: 0.12, error: null, guardando: false, disponible: true,
  onEmpezar: vi.fn(), onParar: vi.fn(), onOffset: vi.fn(), onGuardar: vi.fn(), onDescartar: vi.fn(),
};

describe('Grabar idea en el Atril', () => {
  it('en reposo exige auriculares antes de grabar (botón deshabilitado)', () => {
    const html = renderToStaticMarkup(<GrabarIdea {...base} fase="reposo" />);
    expect(html).toContain('Llevo auriculares');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Grabar idea/s);
  });

  it('grabando muestra Parar y el tiempo', () => {
    const html = renderToStaticMarkup(<GrabarIdea {...base} fase="grabando" segundos={7} />);
    expect(html).toContain('Parar');
    expect(html).toContain('Grabando 7s');
  });

  it('revisando permite ajustar el offset, guardar y descartar', () => {
    const toma = { blob: new Blob(['x']), url: 'blob:x', mime: 'audio/webm' };
    const html = renderToStaticMarkup(<GrabarIdea {...base} fase="revisando" toma={toma} />);
    expect(html).toContain('120 ms');
    expect(html).toContain('Guardar idea');
    expect(html).toContain('Descartar');
  });

  it('el Atril solo ofrece grabar en modo Ensayar y guarda con crearIdeaDeAtril', () => {
    const src = readFileSync('src/components/Atril.tsx', 'utf8');
    expect(src).toMatch(/modo === 'Ensayar' && \(\s*<GrabarIdea/);
    expect(src).toContain('crearIdeaDeAtril');
    expect(src).toContain('sobrePistas');
    expect(src).toContain('offsetSegundos: grabacion.offset');
  });

  it('el componente respeta la identidad visual: sin border ni hexadecimales', () => {
    const src = readFileSync('src/components/chords/GrabarIdea.tsx', 'utf8');
    expect(src).not.toMatch(/\bborder(-|\b)/);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
