import { describe, it, expect } from 'vitest';
import { SPANISH_FESTIVALS, searchFestivalByName } from '../spanishFestivalsDB';

/**
 * Esta lista se escribió a mano y sus emails eran casi todos `info@` + el dominio del festival: deducidos, no leídos de
 * ninguna parte. Un email deducido es un email inventado, y se rellenaba solo en el lead del festival que coincidiera
 * por nombre. Un email solo entra en un lead si se comprueba en la web de la sala (ver emailConEvidencia.ts).
 */
describe('base local de festivales', () => {
  it('no lleva ningún email escrito a mano', () => {
    const conEmail = SPANISH_FESTIVALS.filter((f) => 'email' in f && (f as { email?: string }).email).map((f) => f.nombre);
    expect(conEmail).toEqual([]);
  });

  it('sigue aportando lo que sí es comprobable: fechas, ciudad y web', () => {
    const f = searchFestivalByName('Festival de Benicàssim', 'Benicàssim');
    expect(f).toMatchObject({ ciudad: 'Benicàssim' });
    expect(f?.website).toMatch(/^https:\/\//);
  });
});
