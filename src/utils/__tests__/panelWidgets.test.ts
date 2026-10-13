import { describe, it, expect } from 'vitest';
import { moverEntreVisibles } from '../panelWidgets';

const w = (id: string) => ({ id });
const ids = (l: Array<{ id: string }>) => l.map((x) => x.id).join('');

describe('moverEntreVisibles', () => {
  const todos = [w('a'), w('x'), w('b'), w('c')]; // x está oculto
  const visibles = [w('a'), w('b'), w('c')];

  it('intercambia con el vecino visible, saltándose los ocultos', () => {
    expect(ids(moverEntreVisibles(todos, visibles, 1, 'up'))).toBe('bxac');
    expect(ids(moverEntreVisibles(todos, visibles, 0, 'down'))).toBe('bxac');
    expect(ids(moverEntreVisibles(todos, visibles, 1, 'down'))).toBe('axcb');
  });
  it('en los extremos no mueve nada ni muta la lista original', () => {
    expect(ids(moverEntreVisibles(todos, visibles, 0, 'up'))).toBe('axbc');
    expect(ids(moverEntreVisibles(todos, visibles, 2, 'down'))).toBe('axbc');
    expect(ids(todos)).toBe('axbc');
  });
});
