import { describe, expect, it } from 'vitest';
import { bandIdVariants, renameBandIdInValue } from '../renameBandId.js';

describe('renameBandIdInValue', () => {
  const map = bandIdVariants('band-origen', 'band-destino');

  it('reasigna valores, claves y ids sueltos con y sin prefijo', () => {
    const estado = {
      concerts: [{ id: 'c1', band_id: 'band-origen' }],
      epkConfigsByBand: { 'band-origen': { a: 1 }, origen: { a: 2 } },
      users: [{ band_id: 'reg-origen', band_order: ['origen', 'band-otra'] }],
    };
    expect(renameBandIdInValue(estado, map)).toEqual({
      concerts: [{ id: 'c1', band_id: 'band-destino' }],
      epkConfigsByBand: { 'band-destino': { a: 1 }, destino: { a: 2 } },
      users: [{ band_id: 'reg-destino', band_order: ['destino', 'band-otra'] }],
    });
  });

  it('no muta la entrada ni toca otras bandas', () => {
    const estado = { band_id: 'band-otra', nested: { band_id: 'band-origen' } };
    const copia = renameBandIdInValue(estado, map);
    expect(estado.nested.band_id).toBe('band-origen');
    expect(copia.band_id).toBe('band-otra');
  });

  it('deja intactos números, nulos y booleanos', () => {
    expect(renameBandIdInValue({ n: 1, z: null, b: true }, map)).toEqual({ n: 1, z: null, b: true });
  });
});
