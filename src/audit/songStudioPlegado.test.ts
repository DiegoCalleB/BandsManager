import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const studio = fs.readFileSync(path.join(__dirname, '..', 'components', 'SongStudioModal.tsx'), 'utf-8');

describe('Estudio: plegado de ideas', () => {
  it('ninguna condición fuerza la idea abierta ignorando el chevron', () => {
    expect(studio).not.toMatch(/isIdeaExpanded\s*=\s*filteredIdeas\.length\s*===\s*1/);
    expect(studio).toContain('const isIdeaExpanded = expandedIdeaIds.has(idea.id);');
  });

  it('la auto-expansión solo ocurre una vez por idea (no reabre lo que el usuario plegó)', () => {
    expect(studio).toContain('ideasYaVistasRef');
  });

  it('el atajo «Procesar con Iris» se atiende una sola vez', () => {
    expect(studio).toContain('atajoIrisAtendidoRef');
  });
});

describe('Estudio: restos de clases rotas del formulario de ideas', () => {
  it.each(['/30 hover: bg', 'pt-3/30', 'pt-1/20'])('no contiene "%s"', (resto) => {
    expect(studio).not.toContain(resto);
  });
});

describe('Estudio: motores de Iris', () => {
  it('no ofrece «Iris Pro» (LALAL.AI), que el servidor nunca ejecutó', () => {
    expect(studio).not.toContain('lalalai');
    expect(studio).not.toContain('Iris Pro');
  });
});
