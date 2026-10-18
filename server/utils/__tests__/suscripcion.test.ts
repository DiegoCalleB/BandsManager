import { describe, expect, it } from 'vitest';
import { suscripcionHabilitada } from '../suscripcion';

const bandas = [
  { band_id: 'band-uno', suscripcion_habilitada: true },
  { band_id: 'band-dos', suscripcion_habilitada: false },
  { band_id: 'band-tres' },
  { band_id: 'band-cuatro', suscripcion_habilitada: 'true' },
];

describe('suscripcionHabilitada', () => {
  it('es true solo si la banda tiene el interruptor a true', () => {
    expect(suscripcionHabilitada(bandas, 'band-uno')).toBe(true);
  });
  it.each(['band-dos', 'band-tres'])('es false si %s está apagada o no lo define', (id) => {
    expect(suscripcionHabilitada(bandas, id)).toBe(false);
  });
  it('un valor que no es el booleano true no cuenta', () => {
    expect(suscripcionHabilitada(bandas, 'band-cuatro')).toBe(false);
  });
  it('ignora el prefijo band-/reg- y las mayúsculas, pero exige la misma banda', () => {
    expect(suscripcionHabilitada(bandas, 'REG-uno')).toBe(true);
    expect(suscripcionHabilitada(bandas, 'band-un')).toBe(false);
  });
  it('una banda de otra cuenta con nombre parecido no hereda el permiso (sin coincidencias difusas)', () => {
    expect(suscripcionHabilitada(bandas, 'uno-clon')).toBe(false);
  });
  it.each([undefined, null, '', 'default'])('false si no hay banda válida (%s)', (id) => {
    expect(suscripcionHabilitada(bandas, id as string | undefined)).toBe(false);
  });
  it('false si no hay lista de bandas', () => {
    expect(suscripcionHabilitada(undefined, 'band-uno')).toBe(false);
  });
});
