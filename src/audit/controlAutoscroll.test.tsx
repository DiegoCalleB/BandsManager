import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ControlAutoscroll } from '../components/chords/ControlAutoscroll';
import type { AutoScroll } from '../hooks/useAutoScroll';

const base: AutoScroll = { activo: false, setActivo: () => {}, velocidad: 2, setVelocidad: () => {}, alternar: () => {} };

describe('ControlAutoscroll', () => {
  it('oculta las velocidades en reposo salvo que se pidan siempre', () => {
    expect(renderToStaticMarkup(<ControlAutoscroll auto={base} />)).not.toContain('3x');
    expect(renderToStaticMarkup(<ControlAutoscroll auto={base} velocidadSiempre />)).toContain('3x');
  });
  it('activo muestra «Pausar» y la velocidad elegida pulsada', () => {
    const html = renderToStaticMarkup(<ControlAutoscroll auto={{ ...base, activo: true }} />);
    expect(html).toContain('Pausar');
    expect(html).toMatch(/aria-pressed="true"[^>]*>2x/);
  });
});
