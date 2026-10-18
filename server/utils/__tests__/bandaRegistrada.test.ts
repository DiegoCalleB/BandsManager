import { describe, expect, it } from 'vitest';
import { buscarBandaRegistrada } from '../bandaRegistrada.js';

const gemela = { band_id: 'mi-banda', nombre_banda: 'Mi Banda' };
const real = { band_id: 'band-mi-banda', nombre_banda: 'Mi Banda' };

describe('buscarBandaRegistrada', () => {
  it('con ids gemelos devuelve la del id pedido, sin importar el orden de la lista', () => {
    expect(buscarBandaRegistrada([gemela, real], 'band-mi-banda')).toBe(real);
    expect(buscarBandaRegistrada([real, gemela], 'band-mi-banda')).toBe(real);
    expect(buscarBandaRegistrada([gemela, real], 'mi-banda')).toBe(gemela);
  });

  it('sin id exacto cae al id sin prefijo', () => {
    expect(buscarBandaRegistrada([real], 'mi-banda')).toBe(real);
    expect(buscarBandaRegistrada([{ band_id: 'reg-ruta-66' }], 'band-ruta-66')).toEqual({ band_id: 'reg-ruta-66' });
  });

  it('también casa por el campo id y por el nombre de la banda', () => {
    const porId = { id: 'reg-limando', band_id: 'band-limando' };
    expect(buscarBandaRegistrada([porId], 'reg-limando')).toBe(porId);
    const porNombre = { band_id: 'band-x', nombre_banda: 'Limando' };
    expect(buscarBandaRegistrada([porNombre], 'limando')).toBe(porNombre);
  });

  it('devuelve undefined si no hay ninguna o la lista falta', () => {
    expect(buscarBandaRegistrada([real], 'band-otra')).toBeUndefined();
    expect(buscarBandaRegistrada(undefined, 'band-mi-banda')).toBeUndefined();
  });
});
