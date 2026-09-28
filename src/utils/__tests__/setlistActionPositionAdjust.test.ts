import { describe, it, expect } from 'vitest';
import { adjustIndex, adjustPosition1 } from '../setlistActionPositionAdjust';

describe('setlistActionPositionAdjust', () => {
  describe('adjustIndex — move', () => {
    it('el propio item movido queda en el destino', () => {
      expect(adjustIndex(2, { type: 'move', from: 2, to: 5 })).toBe(5);
    });

    it('los items entre el origen y el destino (moviendo hacia adelante) se desplazan un puesto atrás', () => {
      // mover 2 -> 5: los que estaban en 3,4,5 pasan a 2,3,4
      expect(adjustIndex(3, { type: 'move', from: 2, to: 5 })).toBe(2);
      expect(adjustIndex(5, { type: 'move', from: 2, to: 5 })).toBe(4);
    });

    it('los items entre el destino y el origen (moviendo hacia atrás) se desplazan un puesto adelante', () => {
      // mover 5 -> 2: los que estaban en 2,3,4 pasan a 3,4,5
      expect(adjustIndex(2, { type: 'move', from: 5, to: 2 })).toBe(3);
      expect(adjustIndex(4, { type: 'move', from: 5, to: 2 })).toBe(5);
    });

    it('items fuera del rango afectado no cambian', () => {
      expect(adjustIndex(0, { type: 'move', from: 2, to: 5 })).toBe(0);
      expect(adjustIndex(8, { type: 'move', from: 2, to: 5 })).toBe(8);
    });
  });

  describe('adjustIndex — remove', () => {
    it('el item quitado devuelve null (ya no existe)', () => {
      expect(adjustIndex(3, { type: 'remove', at: 3 })).toBeNull();
    });

    it('los items después del quitado se desplazan un puesto atrás', () => {
      expect(adjustIndex(4, { type: 'remove', at: 3 })).toBe(3);
      expect(adjustIndex(7, { type: 'remove', at: 3 })).toBe(6);
    });

    it('los items antes del quitado no cambian', () => {
      expect(adjustIndex(1, { type: 'remove', at: 3 })).toBe(1);
    });
  });

  describe('adjustIndex — insert', () => {
    it('los items en o después de la posición insertada se desplazan un puesto adelante', () => {
      expect(adjustIndex(3, { type: 'insert', at: 3 })).toBe(4);
      expect(adjustIndex(5, { type: 'insert', at: 3 })).toBe(6);
    });

    it('los items antes de la posición insertada no cambian', () => {
      expect(adjustIndex(1, { type: 'insert', at: 3 })).toBe(1);
    });
  });

  describe('adjustPosition1', () => {
    it('pasa undefined tal cual (campo que esa acción no usa)', () => {
      expect(adjustPosition1(undefined, { type: 'insert', at: 3 })).toBeUndefined();
    });

    it('ajusta una posición 1-indexada aplicando el mismo desplazamiento', () => {
      // posición 1-indexada 5 == 0-indexada 4; insertar en índice 0-indexado 3 la desplaza a 5 (0-idx) == 6 (1-idx)
      expect(adjustPosition1(5, { type: 'insert', at: 3 })).toBe(6);
    });

    it('devuelve null si la posición referenciaba el item quitado', () => {
      // posición 1-indexada 4 == 0-indexada 3
      expect(adjustPosition1(4, { type: 'remove', at: 3 })).toBeNull();
    });
  });
});
