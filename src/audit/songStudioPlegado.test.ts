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

describe('Visor de acordes: el traductor automático no toca los acordes', () => {
  const visor = fs.readFileSync(path.join(__dirname, '..', 'components', 'SongChordsViewerModal.tsx'), 'utf-8');
  const linea = fs.readFileSync(path.join(__dirname, '..', 'components', 'chords', 'LineaTiempoAcordes.tsx'), 'utf-8');

  // Con el idioma en gallego, Google Translate convertía «Mi» en «Meu/Miña», «La» en «A» y «Si» en
  // «Non»: los acordes en notación española son palabras castellanas para un traductor.
  it('la hoja de acordes y los diagramas llevan translate="no"', () => {
    expect((visor.match(/translate="no"/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('la línea de tiempo marca acorde actual, siguiente y carril como no traducibles', () => {
    expect((linea.match(/translate="no"/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
