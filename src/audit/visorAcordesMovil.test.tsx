import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AroAcorde } from '../components/chords/AroAcorde';

const modos = fs.readFileSync(path.join(__dirname, '..', 'utils', 'modosAtril.ts'), 'utf-8');
const visor = fs.readFileSync(path.join(__dirname, '..', 'components', 'Atril.tsx'), 'utf-8');

describe('Visor de acordes en móvil: siempre se puede llegar a la letra', () => {
  // Con la cabecera y el panel de acordes ocupando casi toda la pantalla, el cuerpo con flex-1 se
  // quedaba en 2 px y no había forma de bajar a la letra (captura del usuario).
  it('el modal se desplaza en móvil y el cuerpo tiene altura propia', () => {
    expect(visor).toMatch(/h-\[92vh\] flex flex-col overflow-y-auto overscroll-contain md:overflow-hidden/);
    expect(visor).toMatch(/shrink-0 h-\[75vh\] md:h-auto md:flex-1 md:shrink overflow-hidden/);
  });

  it('los diagramas empiezan cerrados en pantallas estrechas', () => {
    expect(modos).toContain('anchoPantalla >= 768');
    expect(visor).toContain('ajustes.diagramas');
  });
});

describe('AroAcorde: aro de cuenta atrás del acorde', () => {
  const html = (props: Partial<React.ComponentProps<typeof AroAcorde>>) =>
    renderToStaticMarkup(<AroAcorde nombre="Am" progreso={0.25} restante={2} {...props} />);

  it('muestra el acorde y los segundos que faltan', () => {
    const h = html({});
    expect(h).toContain('Am');
    expect(h).toContain('2.0 s');
  });

  it('el aro se llena con el progreso (el hueco restante es proporcional)', () => {
    const r = (Math.max(4, Math.round(84 / 14)) );
    const radio = (84 - r) / 2;
    const C = 2 * Math.PI * radio;
    expect(html({ progreso: 0.25 })).toContain(`stroke-dashoffset="${C * 0.75}"`);
    expect(html({ progreso: 1 })).toContain('stroke-dashoffset="0"');
  });

  it('en el último segundo avisa del cambio cambiando de color', () => {
    expect(html({ restante: 2 })).toContain('stroke="var(--acc)"');
    expect(html({ restante: 0.5 })).toContain('stroke="var(--tentative)"');
  });

  it('el acorde siguiente es un aro tenue sin progreso', () => {
    const h = html({ tenue: true, restante: 1.2 });
    expect(h).not.toContain('stroke-dashoffset');
    expect(h).toContain('1.2 s');
  });

  it('en pausa (restante null) no muestra cuenta atrás y es accesible', () => {
    const h = html({ restante: null });
    expect(h).not.toMatch(/\d\.\d s</);
    expect(h).toContain('aria-label="Am"');
  });

  it('no deja que el traductor automático toque el nombre del acorde', () => {
    expect(html({})).toContain('translate="no"');
  });
});
