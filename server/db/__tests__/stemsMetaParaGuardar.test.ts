import { describe, expect, it } from 'vitest';
import { stemsMetaParaGuardar } from '../repertoire';

const stems = [
  { id: 'p1', nombre: 'Voz', audioUrl: 'v' },
  { id: 'p2', nombre: 'Bajo', audioUrl: 'b' },
];

describe('stemsMetaParaGuardar', () => {
  it('espeja el motor de la idea de Iris', () => {
    const r = stemsMetaParaGuardar([{ id: 'a', pistas: stems, stemEngineUsed: 'demucs', stemIsNeural: true }], null);
    expect(r).toMatchObject({ motor: 'demucs', neural: true });
  });
  it('sin idea de Iris usa lo que llega en la canción', () => {
    expect(stemsMetaParaGuardar([], null, { motor: 'x' })).toEqual({ motor: 'x' });
  });
  it('conserva lo guardado si la idea desaparece', () => {
    expect(stemsMetaParaGuardar([], { stems_meta: { motor: 'old' } })).toEqual({ motor: 'old' });
  });
  it('sin nada no envía la columna', () => {
    expect(stemsMetaParaGuardar([], null)).toBeUndefined();
  });
});
