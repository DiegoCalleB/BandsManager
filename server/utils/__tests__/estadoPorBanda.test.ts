import { describe, it, expect } from 'vitest';
import { fusionarColeccionDeBanda, quitarDeBanda, reemplazarDeBanda } from '../estadoPorBanda';

type Reg = { id: string; band_id?: string; n?: number };

const A: Reg[] = [{ id: 'a1', band_id: 'band-a' }, { id: 'a2', band_id: 'band-a' }];
const B: Reg[] = [{ id: 'b1', band_id: 'band-b' }];

describe('fusionarColeccionDeBanda', () => {
  it('sustituye solo los registros de la banda y conserva los de las demás', () => {
    const r = fusionarColeccionDeBanda([...A, ...B], 'band-a', [{ id: 'a3', band_id: 'band-a' }]);
    expect(r.map((x) => x.id).sort()).toEqual(['a3', 'b1']);
  });

  it('ignora el prefijo band-/reg- al comparar bandas', () => {
    const r = fusionarColeccionDeBanda([...A, ...B], 'reg-a', []);
    expect(r.map((x) => x.id)).toEqual(['b1']);
  });

  it('no deja pasar de la lista nueva un registro que declara otra banda', () => {
    const r = fusionarColeccionDeBanda(B, 'band-a', [{ id: 'x', band_id: 'band-b' }]);
    expect(r.map((x) => x.id)).toEqual(['b1']);
  });

  it('acepta una colección ausente', () => {
    expect(fusionarColeccionDeBanda(undefined, 'band-a', A)).toEqual(A);
  });
});

describe('quitarDeBanda', () => {
  it('no borra de memoria un registro de otra banda aunque coincida el id', () => {
    expect(quitarDeBanda(B, 'band-a', 'b1')).toEqual(B);
  });

  it('borra el registro de la propia banda', () => {
    expect(quitarDeBanda([...A, ...B], 'band-a', 'a1').map((x) => x.id)).toEqual(['a2', 'b1']);
  });
});

describe('reemplazarDeBanda', () => {
  it('no sustituye un registro de otra banda con ese id', () => {
    const guardado: Reg = { id: 'nuevo', band_id: 'band-a' };
    expect(reemplazarDeBanda(B, 'band-a', 'b1', guardado)).toEqual([...B, guardado]);
  });

  it('sustituye el de la propia banda', () => {
    const guardado: Reg = { id: 'a1', band_id: 'band-a', n: 2 };
    const r = reemplazarDeBanda([...A, ...B], 'band-a', 'a1', guardado);
    expect(r.find((x) => x.id === 'a1')?.n).toBe(2);
    expect(r).toHaveLength(3);
  });

  it('añade el guardado si no existía', () => {
    const guardado: Reg = { id: 'a9', band_id: 'band-a' };
    expect(reemplazarDeBanda(A, 'band-a', 'a9', guardado)).toHaveLength(3);
  });
});
