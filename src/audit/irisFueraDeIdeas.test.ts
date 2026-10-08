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
    expect(src.match(/Separar con Iris/g)?.length).toBe(1);
  });
});

describe('El feed de ideas solo lleva tomas', () => {
  it('el feed mapea las tomas (sin Iris) y Iris se pinta en su panel', () => {
    expect(src).toContain('{tomas.map(renderIdeaCard)}');
    expect(src).toContain('{irisIdea && <div className="space-y-6">{renderIdeaCard(irisIdea)}</div>}');
    expect(src).not.toContain('{filteredIdeas.map((idea)');
  });
});
