import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AroAcorde } from '../components/chords/AroAcorde';
import { leerAtril } from './leerAtril';

const modos = fs.readFileSync(path.join(__dirname, '..', 'utils', 'modosAtril.ts'), 'utf-8');
const visor = leerAtril();

describe('Visor de acordes en móvil: siempre se puede llegar a la letra', () => {
  // Con la cabecera y el panel de acordes ocupando casi toda la pantalla, el cuerpo con flex-1 se
  // quedaba en 2 px y no había forma de bajar a la letra (captura del usuario).
  it('en móvil el panel mide la pantalla y la letra hace su scroll dentro del cuerpo', () => {
    expect(visor).toContain('h-[100dvh] sm:h-[92vh]');
    expect(visor).toMatch(/flex flex-col overflow-hidden text-\[var\(--ink\)\]/);
    expect(visor).toMatch(/flex-1 min-h-0 max-md:min-h-\[9\.5rem\] overflow-hidden flex flex-col md:flex-row/);
    // Garantía: la letra nunca baja de ~2 líneas; la franja de arriba y los diagramas ceden sitio.
    expect(visor).toContain('max-md:min-h-[9.5rem]');
  });

  it('la barra del acorde y los diagramas van en el dock inferior en móvil, siempre a la vista', () => {
    expect(visor.match(/max-md:order-last/g)?.length).toBeGreaterThanOrEqual(2);
    expect(visor).toContain('max-md:max-h-[32dvh]');
  });

  it('los diagramas empiezan cerrados (la barra fija ya enseña el que suena)', () => {
    expect(modos).toContain('diagramas: false, oido: true, escucha: \'todo\'');
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

describe('Atril: pantalla completa', () => {
  it('tiene botón que alterna, usa el viewport entero y sale con Esc', () => {
    expect(visor).toContain('alternarPantallaCompleta');
    expect(visor).toContain('h-[100dvh]');
    expect(visor).toContain('fullscreenchange');
    expect(visor).toContain('aria-pressed={pantallaCompleta}');
  });
});
