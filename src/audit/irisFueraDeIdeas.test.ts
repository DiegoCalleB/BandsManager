import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/components/SongStudioModal.tsx', 'utf8');

describe('Iris vive a nivel de canción en el modal', () => {
  it('hay una barra de Iris antes de "Ideas y grabaciones"', () => {
    expect(src.indexOf('Iris · pistas de la canción')).toBeGreaterThan(0);
    expect(src.indexOf('Iris · pistas de la canción')).toBeLessThan(src.indexOf('Ideas y grabaciones'));
  });

  it('las tomas ya no ofrecen "Separar con Iris" por su cuenta', () => {
    expect(src).not.toContain('{!idea.stemEngineUsed && (');
    expect(src.match(/'Separar con Iris'/g)?.length).toBe(2);
  });
});

describe('El feed de ideas solo lleva tomas', () => {
  it('el feed mapea las tomas (sin Iris) y Iris se pinta en su panel', () => {
    expect(src).toContain('{tomas.map((toma) => renderIdeaCard(toma))}');
    expect(src).toContain('{irisIdea ? (\n                  <div className="space-y-6">{renderIdeaCard(irisIdea, { iris: true })}</div>');
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
    expect(src.indexOf('renderIdeaCard(irisIdea, { iris: true })')).toBeGreaterThan(src.indexOf('HOJA DE IRIS'));
  });
});
