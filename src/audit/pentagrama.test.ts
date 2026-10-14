import { describe, expect, it } from 'vitest';
import { claveParaMidi, midiDeEscala, notaDeMidi, prefiereBemoles } from '../utils/pentagrama';

describe('pentagrama', () => {
  it('traduce MIDI a claves de VexFlow', () => {
    expect(notaDeMidi(60)).toEqual({ clave: 'c/4', alteracion: null });
    expect(notaDeMidi(61)).toEqual({ clave: 'c#/4', alteracion: '#' });
    expect(notaDeMidi(70, true)).toEqual({ clave: 'bb/4', alteracion: 'b' });
    expect(notaDeMidi(36)).toEqual({ clave: 'c/2', alteracion: null });
  });
  it('elige la clave por la altura', () => {
    expect(claveParaMidi([36])).toBe('bass');
    expect(claveParaMidi([48, 52, 55])).toBe('bass');
    expect(claveParaMidi([60, 64, 67])).toBe('treble');
  });
  it('escribe con bemoles las tonalidades de bemoles', () => {
    expect(prefiereBemoles('Bb')).toBe(true);
    expect(prefiereBemoles('F')).toBe(true);
    expect(prefiereBemoles('G')).toBe(false);
  });
  it('la escala sube desde la tónica y cierra en la octava', () => {
    expect(midiDeEscala(0, [0, 2, 4, 5, 7, 9, 11])).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(midiDeEscala(9, [9, 11, 0, 2, 4, 5, 7])).toEqual([69, 71, 72, 74, 76, 77, 79, 81]);
  });
});
