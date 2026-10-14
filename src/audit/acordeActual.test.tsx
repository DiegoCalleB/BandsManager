import { describe, it, expect } from 'vitest';
import { leerAtril } from './leerAtril';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarraAcordeActual, DiagramasAcordeActual } from '../components/chords/AcordeActual';
import type { EstadoAcordeActual } from '../components/chords/acordeActualEstado';

const estado = (acorde: string | null, diagramas = true): EstadoAcordeActual => ({ acorde, previo: null, diagramas, alternarDiagramas: () => {} });
const base = { contexto: new Map(), vista: 'guitarra' as const, onVista: () => {} };

describe('BarraAcordeActual', () => {
  it('sin acorde invita a darle al play; con acorde enseña el siguiente', () => {
    expect(renderToStaticMarkup(<BarraAcordeActual estado={estado(null)} onToggle={() => {}} />)).toContain('Dale al play');
    expect(renderToStaticMarkup(<BarraAcordeActual estado={estado(null)} />)).toContain('Con audio');
    const h = renderToStaticMarkup(<BarraAcordeActual estado={estado('Am')} siguiente="G" />);
    expect(h).toContain('Am');
    expect(h).toContain('Siguiente');
    expect(h).not.toMatch(/\bborder/);
  });
  it('barra fija: play/pausa a mano, pegada arriba y con los próximos acordes', () => {
    const h = renderToStaticMarkup(<BarraAcordeActual estado={estado('Am')} proximos={['G', 'C', 'F', 'Dm']} reproduciendo onToggle={() => {}} />);
    expect(h).toContain('sticky top-0');
    expect(h).toContain('aria-label="Pausar"');
    expect(h).toContain('>G<');
    expect(h).toContain('>F<');
    expect(h).not.toContain('>Dm<'); // máximo 3 siguientes
    expect(renderToStaticMarkup(<BarraAcordeActual estado={estado(null)} onToggle={() => {}} />)).toContain('aria-label="Reproducir"');
  });
});

describe('DiagramasAcordeActual', () => {
  it('abiertos por defecto: el que suena y los que vienen, sin bordes', () => {
    const h = renderToStaticMarkup(<DiagramasAcordeActual estado={estado('Am')} sonando="Am" proximos={['G']} {...base} />);
    expect(h).toContain('aria-label="Diagramas de los acordes que vienen"');
    expect(h).not.toMatch(/\bborder/);
  });
  it('con onIr cada próximo es un botón que salta a su sitio del cifrado; sin él, no', () => {
    const con = renderToStaticMarkup(<DiagramasAcordeActual estado={estado('Am')} sonando="Am" proximos={['G', 'C']} indices={[3, 5]} onIr={() => {}} {...base} />);
    expect(con).toContain('aria-label="Ir al acorde G"');
    expect(con).toContain('aria-label="Ir al acorde C"');
    const sin = renderToStaticMarkup(<DiagramasAcordeActual estado={estado('Am')} sonando="Am" proximos={['G']} indices={[3]} {...base} />);
    expect(sin).not.toContain('Ir al acorde');
  });
  it('sin recortes: el carril lleva relleno y no hay anillos ni ids de aviso', () => {
    const h = renderToStaticMarkup(<DiagramasAcordeActual estado={estado('Am')} sonando="Am" proximos={['G']} {...base} />);
    expect(h).toContain('overflow-x-auto p-1');
    expect(h).not.toContain('diagrama-acorde-');
  });
  it('cerrados o sin acorde no pintan nada', () => {
    expect(renderToStaticMarkup(<DiagramasAcordeActual estado={estado('Am', false)} sonando="Am" {...base} />)).toBe('');
    expect(renderToStaticMarkup(<DiagramasAcordeActual estado={estado(null)} sonando={null} {...base} />)).toBe('');
  });
});

describe('Atril', () => {
  it('monta la barra y los diagramas en la pestaña de acordes y deja lo secundario en ⋯', () => {
    const src = leerAtril();
    expect(src).toContain('<BarraAcordeActual');
    expect(src).toContain('<DiagramasAcordeActual');
    expect(src).toContain('label="Más acciones de la canción"');
  });
  it('le pasa play/pausa, los próximos y el reloj', () => {
    const src = leerAtril();
    expect(src).toContain('onToggle={audioUrl ? handleToggleAudio : undefined}');
    expect(src).toContain('proximos={');
    expect(src).toContain('reloj={');
  });
});
