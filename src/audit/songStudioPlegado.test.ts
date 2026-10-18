import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { leerModuloSongStudio } from './songStudioSource';
import { leerAtril } from './leerAtril';

const studio = leerModuloSongStudio();

describe('Estudio: plegado de ideas', () => {
  it('ninguna condición fuerza la idea abierta ignorando el chevron', () => {
    expect(studio).not.toMatch(/isIdeaExpanded\s*=\s*filteredIdeas\.length\s*===\s*1/);
    expect(studio).toContain('const isIdeaExpanded = modoIris || expandedIdeaIds.has(idea.id);');
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
  const visor = leerAtril();
  const linea = fs.readFileSync(path.join(__dirname, '..', 'components', 'chords', 'LineaTiempoAcordes.tsx'), 'utf-8');

  // Con el idioma en gallego, Google Translate convertía «Mi» en «Meu/Miña», «La» en «A» y «Si» en
  // «Non»: los acordes en notación española son palabras castellanas para un traductor.
  it('la hoja de acordes y los diagramas llevan translate="no"', () => {
    const cajon = fs.readFileSync(path.join(__dirname, '..', 'components', 'chords', 'DrawerDiagramas.tsx'), 'utf-8');
    expect((visor.match(/translate="no"/g) || []).length).toBeGreaterThanOrEqual(1); // la hoja
    expect(cajon).toContain('translate="no"'); // el cajón de diagramas
  });

  it('la línea de tiempo, el aro de cada acorde y la regleta de compases son no traducibles', () => {
    const aro = fs.readFileSync(path.join(__dirname, '..', 'components', 'chords', 'AroAcorde.tsx'), 'utf-8');
    const regleta = fs.readFileSync(path.join(__dirname, '..', 'components', 'chords', 'RegletaCompases.tsx'), 'utf-8');
    expect((linea.match(/translate="no"/g) || []).length).toBeGreaterThanOrEqual(1); // carril de acordes
    expect(aro).toContain('translate="no"');
    expect(regleta).toContain('translate="no"');
  });
});
