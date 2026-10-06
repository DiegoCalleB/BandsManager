import { describe, it, expect } from 'vitest';
import { infoDeAcordeVisible } from '../armoniaVisor';
import { parseTonalidad } from '../teoriaArmonica';

describe('infoDeAcordeVisible', () => {
  const E = parseTonalidad('E')!;
  it('acepta nombres en español y en inglés', () => {
    expect(infoDeAcordeVisible('La', E, 0)).toMatchObject({ grado: 'IV', funcion: 'S' });
    expect(infoDeAcordeVisible('A', E, 0)).toMatchObject({ grado: 'IV', funcion: 'S' });
    expect(infoDeAcordeVisible('Re', E, 0)).toMatchObject({ grado: 'bVII', funcion: 'M' });
    expect(infoDeAcordeVisible('Do#m', E, 0)).toMatchObject({ grado: 'vi', funcion: 'T' });
  });
  it('el grado no cambia al transponer: Mi→Sol (+3): el Sol es I y el Do (IV)', () => {
    expect(infoDeAcordeVisible('G', E, 3)).toMatchObject({ grado: 'I' });
    expect(infoDeAcordeVisible('C', E, 3)).toMatchObject({ grado: 'IV' });
    expect(infoDeAcordeVisible('F', E, 3)).toMatchObject({ grado: 'bVII' });
    expect(infoDeAcordeVisible('E', E, -12)).toMatchObject({ grado: 'I' });
  });
  it('sin acorde o basura: null', () => {
    expect(infoDeAcordeVisible('N', E, 0)).toBeNull();
    expect(infoDeAcordeVisible('—', E, 0)).toBeNull();
    expect(infoDeAcordeVisible('', E, 0)).toBeNull();
  });
});
