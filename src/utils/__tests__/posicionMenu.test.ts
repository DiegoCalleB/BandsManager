import { describe, expect, it } from 'vitest';
import { posicionMenu } from '../posicionMenu';

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
