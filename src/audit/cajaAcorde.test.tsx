import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CajaAcorde, SelectorNivel } from '../components/chords/AcordeEnInstrumento';

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

describe('CajaAcorde · tocar y ensayo', () => {
  it('el nombre del acorde se puede pulsar para oírlo, salvo si la ficha ya salta la canción', () => {
    expect(renderToStaticMarkup(<CajaAcorde chord="C" vista="teclado" />)).toContain('aria-label="Oír C"');
    expect(renderToStaticMarkup(<CajaAcorde chord="C" vista="teclado" sonar={false} />)).not.toContain('Oír C');
  });
  it('el selector de nivel trae el interruptor de ensayo', () => {
    expect(renderToStaticMarkup(<SelectorNivel nivel="normal" onCambio={() => {}} />)).toContain('Ensayo');
  });
});
