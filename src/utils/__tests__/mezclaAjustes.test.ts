import { describe, it, expect } from 'vitest';
import type { AudioTrack } from '../../types';
import { alternarSilencio, alternarSolo, hayPistaEnSolo, pistaAudible, volumenEfectivo } from '../mezclaStems';

const pista = (id: string, volumen?: number) => ({ id, nombre: id, audioUrl: `${id}.mp3`, volumen }) as AudioTrack;
const pistas = [pista('bajo'), pista('bateria', 0.5), pista('voz')];

describe('mezcla de pistas: silencio, solo y volumen', () => {
  it('sin ajustes todo suena a su volumen', () => {
    expect(volumenEfectivo(pistas[1], {}, false)).toBe(0.5);
    expect(volumenEfectivo(pistas[0], {}, false)).toBe(1);
  });

  it('el silencio gana al volumen y se puede quitar', () => {
    const a = alternarSilencio({}, 'bajo');
    expect(volumenEfectivo(pistas[0], a, false)).toBe(0);
    expect(volumenEfectivo(pistas[0], alternarSilencio(a, 'bajo'), false)).toBe(1);
  });

  it('el solo es exclusivo y silencia al resto', () => {
    let a = alternarSolo({}, pistas, 'bajo');
    a = alternarSolo(a, pistas, 'voz');
    const solo = hayPistaEnSolo(pistas, a);
    expect(solo).toBe(true);
    expect(pistaAudible(pistas[2], a, solo)).toBe(true);
    expect(pistaAudible(pistas[0], a, solo)).toBe(false);
  });

  it('pulsar el solo activo lo apaga y vuelve todo', () => {
    const a = alternarSolo(alternarSolo({}, pistas, 'bajo'), pistas, 'bajo');
    expect(hayPistaEnSolo(pistas, a)).toBe(false);
    expect(pistaAudible(pistas[1], a, false)).toBe(true);
  });

  it('solo + silencio en la misma pista: no suena', () => {
    const a = alternarSilencio(alternarSolo({}, pistas, 'voz'), 'voz');
    expect(pistaAudible(pistas[2], a, true)).toBe(false);
  });

  it('acota el volumen a 0..1', () => {
    expect(volumenEfectivo(pista('x', 3), {}, false)).toBe(1);
    expect(volumenEfectivo(pista('x', -1), {}, false)).toBe(0);
  });
});
