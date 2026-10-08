import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CajaAcorde } from '../components/chords/AcordeEnInstrumento';

describe('CajaAcorde', () => {
  it('marca la ficha del acorde que suena y la tónica en rectángulo', () => {
    const ctx = { info: { grado: 'I', funcion: 'T' as const }, siguiente: 'A', tonica: true, distancia: 0 };
    const sonando = renderToStaticMarkup(<CajaAcorde chord="E" vista="bajo" contexto={ctx} sonando />);
    expect(sonando).toContain('data-sonando="true"');
    const quieta = renderToStaticMarkup(<CajaAcorde chord="E" vista="bajo" contexto={ctx} />);
    expect(quieta).not.toContain('data-sonando');
    expect(quieta).toContain('rounded-[var(--r-s)]');
  });
});
