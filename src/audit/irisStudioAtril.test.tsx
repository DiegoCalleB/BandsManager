import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { IrisStudio } from '../components/chords/IrisStudio';
import { MOTORES_IRIS } from '../utils/separacionIris';
import { leerAtril } from './leerAtril';

/** Código fuente del visor en directo: el contenedor más todos los módulos de `setlist_performance/` (tras la modularización, ADR 0034). */
function leerConcierto(): string {
  const dir = new URL('../components/setlist_performance/', import.meta.url);
  const modulos = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.includes('__tests__'))
    .sort()
    .map((f) => readFileSync(new URL(f, dir), 'utf8'));
  return [readFileSync(new URL('../components/SetlistPerformanceView.tsx', import.meta.url), 'utf8'), ...modulos].join('\n');
}


// El selector se abre con estado interno: en estático solo comprobamos que no se pinta cerrado.
const selectorHtml = () => (renderToStaticMarkup(<IrisStudio pistas={0} tieneAudio onSeparar={() => {}} />).includes('data-iris-motores') ? 'abierto' : '');

const atril = leerAtril();
const repertorio = readFileSync(new URL('../components/RepertorioSetlists.tsx', import.meta.url), 'utf8');
// Las tarjetas del catálogo viven en CatalogoGeneralView desde el desacople del monolito.
const catalogoView = readFileSync(new URL('../components/repertorio/CatalogoGeneralView.tsx', import.meta.url), 'utf8');

describe('Iris Studio en el Atril (Iris es una acción de la canción)', () => {
  it('sin audio no pinta nada', () => {
    expect(renderToStaticMarkup(<IrisStudio pistas={0} tieneAudio={false} onSeparar={() => {}} />)).toBe('');
  });

  it('con audio y sin pistas invita a separar', () => {
    const html = renderToStaticMarkup(<IrisStudio pistas={0} tieneAudio onSeparar={() => {}} />);
    expect(html).toContain('data-iris-studio="vacio"');
    expect(html).toContain('Separar con Iris');
  });

  it('sin forma de abrir el estudio no ofrece un botón muerto', () => {
    expect(renderToStaticMarkup(<IrisStudio pistas={0} tieneAudio />)).toBe('');
  });

  it('con pistas es la cabecera del mezclador: nº de pistas, motor y cambiar motor', () => {
    const html = renderToStaticMarkup(<IrisStudio pistas={4} motor="Iris Studio" tieneAudio onSeparar={() => {}} />);
    expect(html).toContain('data-iris-studio="listo"');
    expect(html).toContain('4 pistas');
    expect(html).toContain('Iris Studio');
    expect(html).toContain('Cambiar motor');
    expect(html).not.toContain('border');
  });

  it('el Atril separa con Iris él mismo (sin saltar al estudio) y las tarjetas del catálogo siguen abriendo el estudio', () => {
    expect(atril).toContain('<IrisStudio');
    expect(atril).toContain('useSeparacionIris');
    expect(atril).toContain('SongStudioStemProgressModal');
    expect(atril).not.toContain('onAbrirIris');
    expect(repertorio).not.toContain('onAbrirIris');
    expect(catalogoView).toContain('openIris: true');
  });

  it('el selector de motor ofrece los cuatro motores sin bordes', () => {
    expect(MOTORES_IRIS.map(m => m.motor)).toEqual(['fal', 'mvsep-mdx23', 'demucs', 'dsp-server']);
    expect(selectorHtml()).toBe('');
  });
});

describe('Iris no se ofrece dos veces', () => {
  it('el modo concierto no tiene botones «Separar con Iris»: ya existe «Studio» y la tarjeta del Atril', () => {
    const concierto = leerConcierto();
    expect(concierto).not.toContain('Separar con Iris');
    expect(concierto).not.toContain('Separar pistas con Iris');
    expect(concierto).toContain('btn-stage-studio-mode');
  });

  it('«Modo Studio» solo está en el menú «⋮»: no hay botón suelto en la barra superior', () => {
    const concierto = leerConcierto();
    expect(concierto.indexOf('btn-stage-studio-mode')).toBeGreaterThan(concierto.indexOf('showMoreMenu && ('));
    expect(concierto).not.toContain('Quick action: Modo Studio');
  });
});

describe('Atril en Estudiar: controles secundarios tras «Más»', () => {
  it('cifrado, diagramas y copiar solo salen siempre fuera de Estudiar', () => {
    const atril = leerAtril();
    expect(atril).toContain("(modo !== 'Estudiar' || masControles)");
  });
});
