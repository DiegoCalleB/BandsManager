import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { AcordeActual } from '../components/chords/AcordeActual';

const base = { contexto: new Map(), vista: 'guitarra' as const, onVista: () => {} };

describe('AcordeActual', () => {
  it('sin acorde invita a darle al play; con acorde dibuja su diagrama y el siguiente', () => {
    expect(renderToStaticMarkup(<AcordeActual sonando={null} {...base} />)).toContain('Dale al play');
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
});
