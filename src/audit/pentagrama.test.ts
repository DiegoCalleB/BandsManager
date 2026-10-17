import { describe, expect, it } from 'vitest';
import { duracionAcorde } from '../utils/relojAcorde';
import { claveDeVista, claveParaMidi, midiDeEscala, midiEscrito, notaDeMidi, prefiereBemoles } from '../utils/pentagrama';

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
  it('la clave la fija el instrumento, no la altura', () => {
    expect(claveDeVista('bajo')).toBe('bass');
    expect(claveDeVista('teclado')).toBe('treble');
    expect(claveDeVista('guitarra')).toBe('treble');
  });
  it('bajo y guitarra se escriben una octava por encima de lo que suenan', () => {
    expect(midiEscrito([40, 43, 48], 'bajo')).toEqual([52, 55, 60]);
    expect(midiEscrito([52, 59], 'guitarra')).toEqual([64, 71]);
    expect(midiEscrito([48, 52, 55], 'teclado')).toEqual([48, 52, 55]);
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

describe('duración del acorde', () => {
  it('va hasta el siguiente y el último hasta el final', () => {
    expect(duracionAcorde([0, 2, 5], 0, 9)).toBe(2);
    expect(duracionAcorde([0, 2, 5], 2, 9)).toBe(4);
    expect(duracionAcorde([0, 2, 5], 7, 9)).toBeNull();
  });
});
