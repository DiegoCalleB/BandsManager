import { describe, expect, it } from 'vitest';
import { posicionMenu, ajusteHorizontal } from '../posicionMenu';

const ventana = { ancho: 1608, alto: 536 }; // la ventana baja de la captura del bug

describe('posicionMenu', () => {
  it('fila en la parte baja de una ventana baja: abre hacia arriba anclado al botón y limita el alto', () => {
    const p = posicionMenu({ top: 410, bottom: 432, right: 1580 }, ventana);
    expect(p.top).toBeUndefined();
    expect(p.bottom).toBe(536 - 410 + 6); // el borde inferior del menú queda pegado al botón
    expect(p.maxHeight).toBe(396); // todo el espacio de arriba: el menú nunca sale por el borde superior
  });

  it('fila arriba con sitio debajo: abre hacia abajo', () => {
    const p = posicionMenu({ top: 100, bottom: 122, right: 1580 }, { ancho: 1608, alto: 900 });
    expect(p.top).toBe(128);
    expect(p.bottom).toBeUndefined();
    expect(p.maxHeight).toBe(900 - 122 - 14);
  });

  it('el menú nunca queda más alto que el espacio disponible (siempre hay scroll interno)', () => {
    for (const top of [20, 150, 300, 480]) {
      const p = posicionMenu({ top, bottom: top + 22, right: 1580 }, ventana);
      const espacio = p.top !== undefined ? ventana.alto - p.top : ventana.alto - p.bottom!;
      expect(p.maxHeight).toBeLessThanOrEqual(Math.max(140, espacio));
    }
  });

  it('respeta un margen mínimo a la derecha', () => {
    expect(posicionMenu({ top: 100, bottom: 120, right: 1605 }, ventana).right).toBe(8);
  });
});

describe('ajusteHorizontal (móvil de 390 px)', () => {
  it('panel de 224 px alineado a un botón cerca del borde izquierdo: se sale por la izquierda → left 8', () => {
    expect(ajusteHorizontal({ left: -37, right: 187, width: 224 }, 390)).toBe(8);
  });
  it('panel que se sale por la derecha → se pega al borde derecho con margen', () => {
    expect(ajusteHorizontal({ left: 250, right: 474, width: 224 }, 390)).toBe(390 - 8 - 224);
  });
  it('panel que ya cabe → null (no se toca)', () => {
    expect(ajusteHorizontal({ left: 100, right: 324, width: 224 }, 390)).toBeNull();
  });
  it('panel más ancho que la pantalla → left mínimo, nunca negativo', () => {
    expect(ajusteHorizontal({ left: -20, right: 420, width: 440 }, 390)).toBe(8);
  });
});
