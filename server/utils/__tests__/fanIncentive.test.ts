// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { buildFanIncentive } from '../fanIncentive';

describe('buildFanIncentive', () => {
  it('devuelve un incentivo vacío si la banda no ha configurado nada en el apartado QR', () => {
    expect(buildFanIncentive(undefined)).toEqual({});
    expect(buildFanIncentive(null)).toEqual({});
    expect(buildFanIncentive({})).toEqual({});
  });

  it('no inventa un código de descuento cuando la banda no lo ha rellenado', () => {
    const incentivo = buildFanIncentive({ mensajeAgradecimiento: '¡Gracias por unirte!' });
    expect(incentivo.codigoDescuento).toBeUndefined();
    expect(incentivo.enlaceDescarga).toBeUndefined();
    expect(incentivo.mensajeAgradecimiento).toBe('¡Gracias por unirte!');
  });

  it('descarta cadenas vacías o solo con espacios', () => {
    const incentivo = buildFanIncentive({
      mensajeAgradecimiento: '   ',
      enlaceDescarga: '',
      codigoDescuento: '   '
    });
    expect(incentivo).toEqual({});
  });

  it('conserva y recorta los valores que la banda sí ha rellenado', () => {
    const incentivo = buildFanIncentive({
      mensajeAgradecimiento: '  ¡Bienvenido a la familia!  ',
      enlaceDescarga: ' https://ejemplo.com/tema.mp3 ',
      codigoDescuento: ' MIBANDA-FAN-10 '
    });
    expect(incentivo).toEqual({
      mensajeAgradecimiento: '¡Bienvenido a la familia!',
      enlaceDescarga: 'https://ejemplo.com/tema.mp3',
      codigoDescuento: 'MIBANDA-FAN-10'
    });
  });

  it('ignora valores que no son texto', () => {
    const incentivo = buildFanIncentive({ codigoDescuento: 123, enlaceDescarga: { url: 'x' } });
    expect(incentivo).toEqual({});
  });
});
