import { describe, it, expect } from 'vitest';
import { mergeWithExisting } from '../mergeWithExisting';

describe('mergeWithExisting', () => {
  it('lo que manda el caller en camelCase gana a la fila existente en snake_case', () => {
    const merged = mergeWithExisting({ gastos_detalle: { a: 1 } }, { gastosDetalle: { a: 2 } });
    expect(merged.gastos_detalle || merged.gastosDetalle).toEqual({ a: 2 });
  });

  it('un undefined explícito no borra lo existente', () => {
    const merged = mergeWithExisting({ agenda: ['x'] }, { agenda: undefined, notas: 'n' });
    expect(merged.agenda).toEqual(['x']);
    expect(merged.notas).toBe('n');
  });

  it('null o valores falsy enviados sí cuentan como mandados', () => {
    const merged = mergeWithExisting({ setlist_id: 's1', cache: 500 }, { setlistId: null, cache: 0 });
    expect(merged.setlist_id).toBeUndefined();
    expect(merged.setlistId).toBeNull();
    expect(merged.cache).toBe(0);
  });

  it('sin fila existente devuelve el payload tal cual', () => {
    expect(mergeWithExisting(null, { fecha: '2026-10-01' })).toEqual({ fecha: '2026-10-01' });
  });
});
