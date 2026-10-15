import { describe, expect, it } from 'vitest';
import { acotarIndice } from '../useNavegacionItems';

describe('acotarIndice', () => {
  it('deja pasar índices válidos', () => {
    expect(acotarIndice(2, 5)).toBe(2);
  });
  it('no baja de 0 ni pasa del último', () => {
    expect(acotarIndice(-1, 5)).toBe(0);
    expect(acotarIndice(9, 5)).toBe(4);
  });
  it('lista vacía → 0', () => {
    expect(acotarIndice(3, 0)).toBe(0);
  });
  it('si la lista se acorta, apunta al último ítem que queda', () => {
    expect(acotarIndice(4, 3)).toBe(2);
  });
});
