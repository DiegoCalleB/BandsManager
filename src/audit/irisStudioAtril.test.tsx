import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { IrisStudio } from '../components/chords/IrisStudio';

const atril = readFileSync(new URL('../components/Atril.tsx', import.meta.url), 'utf8');
const repertorio = readFileSync(new URL('../components/RepertorioSetlists.tsx', import.meta.url), 'utf8');

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

  it('el Atril lo pinta y el repertorio abre la separación del estudio', () => {
    expect(atril).toContain('<IrisStudio');
    expect(atril).toContain('onAbrirIris');
    expect(repertorio).toContain('onAbrirIris={');
    expect(repertorio).toContain('openIris: true');
  });
});

describe('Iris no se ofrece dos veces', () => {
  it('el modo concierto no tiene botones «Separar con Iris»: ya existe «Studio» y la tarjeta del Atril', () => {
    const concierto = readFileSync(new URL('../components/SetlistPerformanceView.tsx', import.meta.url), 'utf8');
    expect(concierto).not.toContain('Separar con Iris');
    expect(concierto).not.toContain('Separar pistas con Iris');
    expect(concierto).toContain('btn-stage-studio-mode');
  });

  it('«Modo Studio» solo está en el menú «⋮»: no hay botón suelto en la barra superior', () => {
    const concierto = readFileSync(new URL('../components/SetlistPerformanceView.tsx', import.meta.url), 'utf8');
    expect(concierto.indexOf('btn-stage-studio-mode')).toBeGreaterThan(concierto.indexOf('showMoreMenu && ('));
    expect(concierto).not.toContain('Quick action: Modo Studio');
  });
});

describe('Atril en Estudiar: controles secundarios tras «Más»', () => {
  it('cifrado, diagramas y copiar solo salen siempre fuera de Estudiar', () => {
    const atril = readFileSync(new URL('../components/Atril.tsx', import.meta.url), 'utf8');
    expect(atril).toContain("(modo !== 'Estudiar' || masControles)");
  });
});
