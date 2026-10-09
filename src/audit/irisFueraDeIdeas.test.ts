import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { leerModuloSongStudio } from './songStudioSource';

const src = leerModuloSongStudio();

describe('Iris vive a nivel de canción en el modal', () => {
  it('hay una barra de Iris antes de "Ideas y grabaciones"', () => {
    expect(src).toContain('Iris · pistas de la canción');
    expect(src).toContain('Ideas y grabaciones');
    const cuerpo = readFileSync('src/components/song_studio/SongStudioContentBody.tsx', 'utf8');
    expect(cuerpo.indexOf('<SongStudioIrisBar />')).toBeGreaterThan(-1);
    expect(cuerpo.indexOf('<SongStudioIrisBar />')).toBeLessThan(cuerpo.indexOf('<SongStudioIdeasBar />'));
  });

  it('las tomas ya no ofrecen "Separar con Iris" por su cuenta', () => {
    expect(src).not.toContain('{!idea.stemEngineUsed && (');
    expect(src.match(/'Separar con Iris'/g)?.length).toBe(2);
  });
});

describe('El feed de ideas solo lleva tomas', () => {
  it('el feed mapea las tomas (sin Iris) y Iris se pinta en su panel', () => {
    expect(src).toMatch(/tomas\.map\(\(toma\) => \(\s*<SongStudioIdeaCard key=\{toma\.id\} idea=\{toma\} \/>/);
    expect(src).toMatch(/\{irisIdea \? \(\s*<div className="space-y-6"><SongStudioIdeaCard idea=\{irisIdea\} opts=\{\{ iris: true \}\} \/><\/div>/);
    expect(src).not.toContain('{filteredIdeas.map((idea)');
  });

  it('el panel de Iris no lleva cabecera de idea (título, autor, borrar, + Pista, + Base tema)', () => {
    expect(src).toContain('const modoIris = !!opts?.iris;');
    expect(src).toContain("{modoIris ? 'Pistas de la canción' : idea.titulo}");
    expect(src).toContain('{!modoIris && (<div className="flex items-center gap-2 flex-wrap justify-end">');
    expect(src).toContain('{!modoIris && selectedSongBaseUrl');
    expect(src).toContain('{!modoIris && (\n                            <IconButton\n                              label="Eliminar idea"');
  });
});

describe('Los stems se escriben en la canción', () => {
  it('el mezclador no escribe `pistas` directamente en una idea: pasa por cancionConPistas', () => {
    expect(src).not.toMatch(/\.\.\.i, pistas/);
    expect(src).toContain('cancionConPistas(song, idea, updatedTracks)');
  });
});

describe('Iris tiene su propia hoja', () => {
  it('el estudio solo trae la entrada y la hoja lleva el mezclador', () => {
    expect(src).toContain('setShowIrisPanel(true)');
    expect(src).toContain('aria-label="Iris, pistas de la canción"');
    expect(src.indexOf('<SongStudioIdeaCard idea={irisIdea} opts={{ iris: true }} />')).toBeGreaterThan(src.indexOf('HOJA DE IRIS'));
  });
});

describe('Ideas: pistas de Iris para grabar encima', () => {
  const studio = src;
  it('el selector guarda ids por referencia (ideasConFondo), sin copiar audio', () => {
    expect(studio).toContain('Pistas de Iris para grabar encima');
    expect(studio).toContain('ideasConFondo(');
  });
  it('la grabación encima reproduce las pistas elegidas y las para al detener', () => {
    expect(studio).toContain('pistasBaseDeIdea(idea, pistasDeCancion(song))');
    expect(studio).toMatch(/stopRecordingTrackOverdub = \(\) => \{\s*basePlayRefs/);
  });
});

describe('Ideas: pistas de Iris al crear la idea', () => {
  it('el formulario de nueva idea deja elegir pistas de Iris y las guarda por referencia', () => {
    expect(src).toContain('nuevaIdeaPistasIris');
    expect(src).toContain('ideaConPistasBase(newIdea, idsIris)');
  });
});

describe('Ideas: pistas de Iris visibles y audibles en el mezclador', () => {
  it('el transporte usa pistasDeReproduccion y la mezcla de las pistas de Iris va a la idea', () => {
    expect(src).toContain('pistasDeReproduccion(idea)');
    expect(src).toContain('cancionConMezcla(song, idea, updatedTracks)');
    expect(src).toContain('esPistaBase(idea.id, tr.id)');
  });

  it('las pistas de Iris se quitan de la idea con el aspa (sin tocar la canción) y el sync corrige deriva fina', () => {
    expect(src).toContain('Quitar de la idea (la pista sigue en Iris)');
    expect(src).toContain('lastDriftFixMapRef');
  });
});
