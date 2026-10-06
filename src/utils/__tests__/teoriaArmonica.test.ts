import { describe, it, expect } from 'vitest';
import {
  parseAcorde, parseTonalidad, gradoRomano, analizarAcorde, estimarTonalidad, estimarModo, encontrarBucle,
  escalasSugeridas, notasDelAcorde, usaBemoles, nombreDeNota, analizarArmonia, funcionDeIntervalo, type TramoAcorde,
} from '../teoriaArmonica';

const E = parseTonalidad('E')!;
const Am = parseTonalidad('Am')!;
const C = parseTonalidad('C')!;
const seq = (...acordes: string[]): TramoAcorde[] => acordes.map((acorde, i) => ({ t0: i * 2, t1: (i + 1) * 2, acorde }));

describe('parseTonalidad y parseAcorde', () => {
  it.each([['E', 4, false], ['Em', 4, true], ['F#m', 6, true], ['Bb', 10, false], ['Mi', 4, false], ['Lam', 9, true], ['Do#m', 1, true], ['Sol', 7, false]])('%s', (txt, tonica, menor) => {
    expect(parseTonalidad(txt)).toMatchObject({ tonica, menor });
  });
  it('rechaza lo que no es una tonalidad', () => {
    expect(parseTonalidad('')).toBeNull();
    expect(parseTonalidad('xyz')).toBeNull();
    expect(parseTonalidad(null)).toBeNull();
  });
  it('acordes con calidades y bajo', () => {
    expect(parseAcorde('F#m7')).toMatchObject({ raiz: 6, menor: true, septima: '7' });
    expect(parseAcorde('Cmaj7')).toMatchObject({ raiz: 0, menor: false, septima: 'maj7' });
    expect(parseAcorde('Bdim')).toMatchObject({ raiz: 11, disminuido: true });
    expect(parseAcorde('Bm7b5')).toMatchObject({ disminuido: true });
    expect(parseAcorde('Gsus4')).toMatchObject({ sus: true, menor: false });
    expect(parseAcorde('C/E')).toMatchObject({ raiz: 0, bajo: 4 });
    expect(parseAcorde('N')).toBeNull();
    expect(parseAcorde('Hola')).toBeNull();
  });
});

describe('gradoRomano (relativo a la escala mayor de la tónica)', () => {
  it.each([
    ['E', 'E', 'I'], ['D', 'E', 'bVII'], ['A', 'E', 'IV'], ['B', 'E', 'V'], ['C#m', 'E', 'vi'], ['F#m', 'E', 'ii'],
    ['G#m', 'E', 'iii'], ['G', 'E', 'bIII'], ['Bm', 'E', 'v'], ['B7', 'E', 'V7'], ['Amaj7', 'E', 'IVmaj7'], ['D#dim', 'E', 'vii°'],
    ['Am', 'A', 'i'], ['G', 'A', 'bVII'], ['F', 'A', 'bVI'], ['C', 'A', 'bIII'], ['Dm', 'A', 'iv'], ['E', 'A', 'V'], ['E7', 'A', 'V7'], ['Bdim', 'A', 'ii°'],
    ['Bb', 'C', 'bVII'], ['F#', 'C', '#IV'], ['Dm7', 'C', 'ii7'],
  ])('%s en %s → %s', (acorde, tono, esperado) => {
    expect(gradoRomano(acorde, parseTonalidad(tono)!.tonica)).toBe(esperado);
  });
});

describe('función armónica', () => {
  it('en Do mayor', () => {
    const f = (a: string) => analizarAcorde(a, C)!.funcion;
    expect([f('C'), f('Em'), f('Am')]).toEqual(['T', 'T', 'T']);
    expect([f('Dm'), f('F')]).toEqual(['S', 'S']);
    expect([f('G'), f('G7'), f('Bdim')]).toEqual(['D', 'D', 'D']);
    expect([f('Bb'), f('Eb'), f('Ab'), f('Fm')]).toEqual(['M', 'M', 'M', 'M']);
    expect(f('F#')).toBe('X');
    expect(f('Db')).toBe('M'); // bII mayor: color frigio / napolitano
  });
  it('en La menor', () => {
    const f = (a: string) => analizarAcorde(a, Am)!.funcion;
    expect([f('Am'), f('C')]).toEqual(['T', 'T']);
    expect([f('Dm'), f('F')]).toEqual(['S', 'S']);
    expect([f('E'), f('Em'), f('G')]).toEqual(['D', 'D', 'D']);
    expect(f('D')).toBe('M'); // IV mayor en menor: dórico
  });
  it('dominante secundario: D mayor antes de G en Do es V/V y cuenta como dominante', () => {
    const r = analizarAcorde('D', C, 'G')!;
    expect(r).toMatchObject({ grado: 'II', funcion: 'D', secundario: 'V/V' });
    expect(analizarAcorde('D', C, 'F')!.funcion).toBe('X'); // sin resolución a la quinta: ajeno
    expect(analizarAcorde('E', C, 'Am')!.secundario).toBe('V/vi');
  });
  it('N y basura no se analizan', () => {
    expect(analizarAcorde('N', C)).toBeNull();
    expect(funcionDeIntervalo(0, 'maj', false)).toBe('T');
  });
});

describe('tonalidad y modo', () => {
  it('estima la tonalidad con acordes de rock', () => {
    expect(estimarTonalidad(seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'E'))!.nombre).toBe('E');
    expect(estimarTonalidad(seq('C', 'F', 'G', 'Am'))!.nombre).toBe('C');
    expect(estimarTonalidad(seq('Am', 'F', 'C', 'G'))!.nombre).toBe('Am'); // relativas: gana la que abre
    expect(estimarTonalidad(seq('A'))).toBeNull();
  });
  it('mixolidio: «Born to be wild» (E, A, D) y A-G-D', () => {
    const bt = seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'E');
    expect(estimarModo(bt, E).id).toBe('mixolidio');
    expect(estimarModo(seq('A', 'G', 'D', 'A', 'G', 'D'), parseTonalidad('A')!).id).toBe('mixolidio');
  });
  it('jónico, eólico, dórico y frigio', () => {
    expect(estimarModo(seq('C', 'F', 'G', 'Am'), C).id).toBe('jonico');
    expect(estimarModo(seq('Am', 'G', 'F', 'G', 'Am'), Am).id).toBe('eolico');
    expect(estimarModo(seq('Dm', 'G', 'Dm', 'G'), parseTonalidad('Dm')!).id).toBe('dorico');
    expect(estimarModo(seq('Em', 'F', 'Em', 'F'), parseTonalidad('Em')!).id).toBe('frigio');
    expect(estimarModo(seq('C', 'D', 'C', 'D'), C).id).toBe('lidio');
  });
});

describe('progresiones con nombre y bucle', () => {
  const grados = (acordes: string[], t = C) => acordes.map((a) => gradoRomano(a, t.tonica)!);

  it('el eje del pop, aunque la canción empiece por otro acorde', () => {
    const b = encontrarBucle(grados(['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F']))!;
    expect(b.grados).toEqual(['I', 'V', 'vi', 'IV']);
    expect(b.nombre).toMatch(/eje/);
    const r = encontrarBucle(grados(['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G']))!;
    expect(r.nombre).toMatch(/eje|pop/);
    expect(r.veces).toBe(3);
  });
  it('rock mixolidio: I–bVII–IV', () => {
    const b = encontrarBucle(grados(['E', 'D', 'A', 'E', 'D', 'A', 'E', 'D', 'A'], E))!;
    expect(b.grados).toEqual(['I', 'bVII', 'IV']);
    expect(b.nombre).toMatch(/mixolidio/);
  });
  it('cadencia andaluza', () => {
    const b = encontrarBucle(grados(['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E'], Am))!;
    expect(b.nombre).toMatch(/andaluza/);
  });
  it('sin repetición clara no hay bucle', () => {
    expect(encontrarBucle(['I', 'IV', 'V', 'vi', 'ii', 'iii', 'bVII', 'III'])).toBeNull();
    expect(encontrarBucle(['I', 'IV'])).toBeNull();
  });
});

describe('notas y escalas', () => {
  it('nombres en inglés y en español, con sostenidos o bemoles', () => {
    expect(nombreDeNota(6, false)).toBe('F#');
    expect(nombreDeNota(6, true)).toBe('Gb');
    expect(nombreDeNota(9, false, 'ES')).toBe('La');
    expect(nombreDeNota(10, true, 'ES')).toBe('Sib');
  });
  it('bemoles según la escala padre', () => {
    expect(usaBemoles(parseTonalidad('F')!)).toBe(true);
    expect(usaBemoles(parseTonalidad('Dm')!)).toBe(true);
    expect(usaBemoles(parseTonalidad('E')!)).toBe(false);
    expect(usaBemoles(parseTonalidad('Am')!)).toBe(false);
    expect(usaBemoles(parseTonalidad('Bb')!)).toBe(true);
  });
  it('en E mixolidio: sobre D (bVII) suena D lidio; sobre A, A jónico; sobre E, E mixolidio', () => {
    const nombres = (a: string) => escalasSugeridas(a, E, 'mixolidio').map((e) => e.nombre);
    expect(nombres('D')[0]).toBe('{R} lidio');
    expect(nombres('A')[0]).toBe('{R} jónico');
    expect(nombres('E')[0]).toBe('{R} mixolidio');
    const mix = escalasSugeridas('E', E, 'mixolidio')[0];
    expect(mix.notas).toEqual([4, 6, 8, 9, 11, 1, 2]); // E F# G# A B C# D
    // la tónica en rock ofrece la escala de blues
    expect(escalasSugeridas('E', E, 'mixolidio').some((x) => /Blues/.test(x.nombre))).toBe(true);
  });
  it('un acorde fuera de la escala se ofrece como prestado', () => {
    const r = escalasSugeridas('Bb', C, 'jonico')[0];
    expect(r.motivo).toMatch(/prestado/);
    expect(r.nombre).toBe('{R} mixolidio');
  });
  it('notas guía: tercera y séptima', () => {
    expect(notasDelAcorde('Em')).toMatchObject({ tercera: 7, quinta: 11, septima: 2, guia: [7, 2] });
    expect(notasDelAcorde('G7')).toMatchObject({ tercera: 11, septima: 5 });
    expect(notasDelAcorde('Cmaj7')).toMatchObject({ tercera: 4, septima: 11 });
    expect(notasDelAcorde('C')).toMatchObject({ tercera: 4, septima: null, guia: [4] });
    expect(notasDelAcorde('D', 'D')!.septima).toBe(0); // dominante: la 7.ª menor «pega» aunque no se toque
  });
});

describe('analizarArmonia: «Born to be wild»', () => {
  const bt = seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'E', 'E', 'A', 'D', 'E');

  it('E mixolidio, grados I–IV–bVII, mucha tónica y color modal', () => {
    const a = analizarArmonia(bt, null)!;
    expect(a.tonalidad.nombre).toBe('E');
    expect(a.tonalidadEstimada).toBe(true);
    expect(a.modo.id).toBe('mixolidio');
    expect(a.acordes.map((x) => `${x.acorde}:${x.grado}:${x.funcion}`)).toEqual(['E:I:T', 'A:IV:S', 'D:bVII:M']);
    expect(a.funciones.T).toBeGreaterThan(0.5);
    expect(a.funciones.M).toBeGreaterThan(0);
    expect(a.funciones.T + a.funciones.S + a.funciones.D + a.funciones.M + a.funciones.X).toBeCloseTo(1, 1);
  });
  it('la tonalidad de la ficha manda sobre la estimada', () => {
    const a = analizarArmonia(bt, 'E')!;
    expect(a.tonalidadEstimada).toBe(false);
    const otra = analizarArmonia(bt, 'A')!; // si la ficha dice A, los grados cambian con ella
    expect(otra.acordes.find((x) => x.acorde === 'E')!.grado).toBe('V');
  });
  it('los «N» no se analizan y el ritmo armónico sale en cambios por minuto', () => {
    const conN = [...bt.slice(0, 3), { t0: 6, t1: 7, acorde: 'N' }, ...bt.slice(3)];
    const a = analizarArmonia(conN, 'E')!;
    expect(a.porTramo[3]).toBeNull();
    expect(a.cambiosPorMinuto).toBeGreaterThan(0);
  });
  it('sin material suficiente devuelve null', () => {
    expect(analizarArmonia(seq('E'), 'E')).toBeNull();
    expect(analizarArmonia([], null)).toBeNull();
  });
});

import { explicarAcorde, intervaloDeGrado } from '../teoriaArmonica';

describe('explicarAcorde: por qué un acorde tiene su color', () => {
  it('grados romanos a semitonos', () => {
    expect([intervaloDeGrado('I'), intervaloDeGrado('bVII'), intervaloDeGrado('vi'), intervaloDeGrado('V7'), intervaloDeGrado('#IV'), intervaloDeGrado('ii°')]).toEqual([0, 10, 9, 7, 6, 2]);
    expect(intervaloDeGrado('?')).toBeNull();
  });
  it('cuenta la posición respecto a la tónica y qué hace esa posición', () => {
    expect(explicarAcorde({ grado: 'I', funcion: 'T' }, 'Mi', 'Mi mayor')).toBe('Mi (I) es la tónica (el «1») de Mi mayor: es un acorde de reposo: aquí la música se siente «en casa».');
    expect(explicarAcorde({ grado: 'IV', funcion: 'S' }, 'La', 'Mi mayor')).toMatch(/La \(IV\) es el 4\.º grado de Mi mayor: te aleja de casa/);
    expect(explicarAcorde({ grado: 'V', funcion: 'D' }, 'Si', 'Mi mayor')).toMatch(/crea tensión/);
    expect(explicarAcorde({ grado: 'bVII', funcion: 'M' }, 'Re', 'Mi mayor')).toMatch(/7\.º grado bajado de Mi mayor: no pertenece a la escala.*prestado/);
  });
  it('un dominante secundario explica a quién tira', () => {
    expect(explicarAcorde({ grado: 'II', funcion: 'D', secundario: 'V/V' }, 'D', 'C mayor')).toMatch(/quinta por encima de V y tira hacia él \(dominante secundario V\/V\)/);
  });
});
