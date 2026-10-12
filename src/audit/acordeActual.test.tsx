import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { AcordeActual } from '../components/chords/AcordeActual';

const base = { contexto: new Map(), vista: 'guitarra' as const, onVista: () => {} };

describe('AcordeActual', () => {
  it('sin acorde invita a darle al play; con acorde dibuja su diagrama y el siguiente', () => {
    expect(renderToStaticMarkup(<AcordeActual sonando={null} onToggle={() => {}} {...base} />)).toContain('Dale al play');
    expect(renderToStaticMarkup(<AcordeActual sonando={null} {...base} />)).toContain('Con audio');
    const h = renderToStaticMarkup(<AcordeActual sonando="Am" siguiente="G" {...base} />);
    expect(h).toContain('Am');
    expect(h).toContain('Siguiente');
    expect(h).not.toMatch(/\bborder/);
  });
  it('Atril lo monta en la pestaña de acordes y deja lo secundario en ⋯', () => {
    const src = readFileSync('src/components/Atril.tsx', 'utf8');
    expect(src).toContain('<AcordeActual');
    expect(src).toContain('label="Más acciones de la canción"');
  });
  it('barra fija: play/pausa a mano, pegada arriba y con los próximos acordes', () => {
    const h = renderToStaticMarkup(<AcordeActual sonando="Am" proximos={['G', 'C', 'F', 'Dm']} reproduciendo onToggle={() => {}} {...base} />);
    expect(h).toContain('sticky top-0');
    expect(h).toContain('aria-label="Pausar"');
    expect(h).toContain('>G<');
    expect(h).toContain('>F<');
    expect(h).not.toContain('>Dm<'); // máximo 3 siguientes
    const p = renderToStaticMarkup(<AcordeActual sonando={null} onToggle={() => {}} {...base} />);
    expect(p).toContain('aria-label="Reproducir"');
  });
  it('Atril le pasa play/pausa y los próximos acordes', () => {
    const src = readFileSync('src/components/Atril.tsx', 'utf8');
    expect(src).toContain('onToggle={audioUrl ? handleToggleAudio : undefined}');
    expect(src).toContain('proximos={');
  });
});
