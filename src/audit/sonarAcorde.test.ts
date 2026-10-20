import { afterEach, describe, expect, it, vi } from 'vitest';
import { midiDeAcorde } from '../utils/sonarAcorde';
import { bajarCancion, factorDucking, suscribirDucking } from '../utils/ducking';

describe('midiDeAcorde', () => {
  it('piano: la tríada de Do en fundamental y en primera inversión', () => {
    expect(midiDeAcorde('C', 'teclado', 'normal', 0)).toEqual([60, 64, 67]);
    expect(midiDeAcorde('C', 'teclado', 'normal', 1)).toEqual([64, 67, 72]);
  });
  it('Normal suma la 7.ª si el acorde la lleva y Básico la quita', () => {
    expect(midiDeAcorde('G7', 'teclado', 'normal', 0)).toHaveLength(4);
    expect(midiDeAcorde('G7', 'teclado', 'basico', 0)).toHaveLength(3);
  });
  it('guitarra Básico: solo raíz y quinta (power chord)', () => {
    expect(midiDeAcorde('E', 'guitarra', 'basico', 0)).toEqual([52, 59]);
  });
  it('guitarra: la voz no baja de Mi3, para que se escriba dentro del pentagrama', () => {
    for (const a of ['C', 'D', 'F', 'G', 'A', 'Am', 'Em', 'G7']) {
      expect(Math.min(...midiDeAcorde(a, 'guitarra', 'normal', 0))).toBeGreaterThanOrEqual(52);
    }
  });
  it('bajo: las notas del acorde una a una, de grave a agudo, empezando por la de la inversión, y cierra en la octava', () => {
    expect(midiDeAcorde('C', 'bajo', 'normal', 0)).toEqual([36, 40, 43, 48]);
    expect(midiDeAcorde('C', 'bajo', 'normal', 1)).toEqual([28, 31, 36, 40]);
    expect(midiDeAcorde('C', 'bajo', 'basico', 0)).toEqual([36, 43]);
  });
  it('bajo: suena la nota de paso hacia el acorde siguiente, la misma que ve el mástil', () => {
    const sin = midiDeAcorde('C', 'bajo', 'normal', 0);
    const con = midiDeAcorde('C', 'bajo', 'normal', 0, 'F');
    expect(con.slice(0, 3)).toEqual(sin.slice(0, 3));
    expect([4, 6]).toContain(con[3] % 12); // un semitono bajo o sobre Fa, la que quede más cerca de la mano
    expect(midiDeAcorde('C', 'bajo', 'basico', 0, 'F')).toEqual([36, 43]);
  });
  it('un acorde que no se reconoce no suena', () => {
    expect(midiDeAcorde('xyz', 'teclado')).toEqual([]);
  });
});

describe('ducking', () => {
  afterEach(() => vi.useRealTimers());
  it('baja la canción, avisa a los oyentes y la devuelve a 1', () => {
    vi.useFakeTimers();
    const avisos: number[] = [];
    const baja = suscribirDucking(() => avisos.push(factorDucking()));
    bajarCancion(1000);
    expect(factorDucking()).toBeLessThan(0.5);
    vi.advanceTimersByTime(1000 + 300);
    expect(factorDucking()).toBe(1);
    expect(avisos[0]).toBeLessThan(0.5);
    baja();
  });
  it('repetir reinicia la cuenta y no deja la canción atascada', () => {
    vi.useFakeTimers();
    bajarCancion(1000);
    vi.advanceTimersByTime(800);
    bajarCancion(1000);
    vi.advanceTimersByTime(800);
    expect(factorDucking()).toBeLessThan(0.5);
    vi.advanceTimersByTime(600);
    expect(factorDucking()).toBe(1);
  });
});
