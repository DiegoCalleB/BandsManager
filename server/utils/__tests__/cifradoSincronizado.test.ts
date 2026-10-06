import { describe, it, expect } from 'vitest';
import { construirCifradoSincronizado, cambiosDeAcorde, acordeEnInstante } from '../cifradoSincronizado';
import { alinearCifradoConAudio, acordesDelCifrado } from '../../../src/utils/alineacionAcordes';

const ac = (acorde: string, t0: number, t1: number) => ({ t0, t1, acorde, confianza: 0.9 });

describe('construirCifradoSincronizado', () => {
  const acordes = [ac('A', 0, 4), ac('E', 4, 8), ac('F#m', 8, 12), ac('D', 12, 16)];

  it('pone cada acorde delante de la palabra que suena cuando cambia (con tiempos por palabra)', () => {
    const lineas = [{
      t0: 0.5, t1: 7.5, texto: 'La máquina funcionó non me culpes',
      palabras: [
        { t0: 0.5, t1: 1, texto: 'La' }, { t0: 1.2, t1: 2, texto: 'máquina' }, { t0: 2.2, t1: 3.5, texto: 'funcionó' },
        { t0: 4.1, t1: 4.6, texto: 'non' }, { t0: 5, t1: 5.5, texto: 'me' }, { t0: 6, t1: 7.5, texto: 'culpes' },
      ],
    }];
    const t = construirCifradoSincronizado(lineas, acordes);
    expect(t.split('\n')[0]).toBe('[A]La máquina funcionó [E]non me culpes');
    // la progresión sigue sonando tras la última frase: va en un [Outro], no se pierde
    expect(t).toMatch(/\[Outro\]\n\[E\] \[F#m\] \[D\]$/);
  });

  it('sin tiempos por palabra reparte proporcionalmente y cae en un inicio de palabra', () => {
    const txt = construirCifradoSincronizado([{ t0: 0, t1: 8, texto: 'uno dos tres cuatro' }], acordes);
    expect(txt.startsWith('[A]uno ')).toBe(true);
    expect(txt).toMatch(/\[E\]/);
    expect(txt.split('\n')[0].replace(/\[[^\]]+\]/g, '')).toBe('uno dos tres cuatro'); // ni una palabra añadida o perdida
  });

  it('antes de la primera frase: [Intro]; después de la última: [Outro]; huecos: [Instrumental]', () => {
    const lineas = [{ t0: 8, t1: 10, texto: 'primera frase' }, { t0: 20, t1: 22, texto: 'segunda frase' }];
    const acs = [ac('A', 0, 4), ac('E', 4, 8), ac('F#m', 8, 12), ac('D', 12, 16), ac('A', 16, 24), ac('E', 24, 30)];
    const t = construirCifradoSincronizado(lineas, acs);
    expect(t).toMatch(/^\[Intro\]\n\[A\] \[E\]/);
    expect(t).toContain('[Instrumental]');
    expect(t).toMatch(/\[Outro\]\n\[A\] \[E\]$/);
  });

  it('sin acordes devuelve solo la letra, sin corchetes', () => {
    expect(construirCifradoSincronizado([{ t0: 0, t1: 2, texto: 'solo letra' }], [])).toBe('solo letra');
  });

  it('sin letra no inventa nada', () => {
    expect(construirCifradoSincronizado([], acordes)).toBe('');
  });

  it('el cifrado resultante se alinea perfectamente con los acordes detectados (la sincronía se mantiene)', () => {
    const lineas = [
      { t0: 0.2, t1: 7.8, texto: 'primera frase de la canción con letra' },
      { t0: 8.2, t1: 15.8, texto: 'segunda frase bastante larga también' },
    ];
    const cifrado = construirCifradoSincronizado(lineas, acordes);
    expect(acordesDelCifrado(cifrado)).toEqual(['A', 'E', 'F#m', 'D']);
    const al = alinearCifradoConAudio(cifrado, acordes)!;
    expect(al.usable).toBe(true);
    expect(al.calidad).toBe(1);
  });
});

describe('cambiosDeAcorde / acordeEnInstante', () => {
  it('descarta «N» y repetidos consecutivos', () => {
    expect(cambiosDeAcorde([ac('A', 0, 2), ac('A', 2, 4), ac('N', 4, 6), ac('E', 6, 8)])).toEqual([{ t0: 0, acorde: 'A' }, { t0: 6, acorde: 'E' }]);
  });
  it('devuelve el acorde vigente', () => {
    const c = [{ t0: 0, acorde: 'A' }, { t0: 5, acorde: 'E' }];
    expect(acordeEnInstante(c, 4.9)).toBe('A');
    expect(acordeEnInstante(c, 5)).toBe('E');
    expect(acordeEnInstante(c, -1)).toBeNull();
  });
});

import { asociarLineasConLetra } from '../../../src/utils/alineacionAcordes';

describe('el cifrado que construimos y el visor de karaoke se entienden', () => {
  it('cada línea de letra del cifrado generado se asocia con su línea transcrita, en orden', () => {
    const lineas = [
      { t0: 8, t1: 11, texto: 'primera frase de la canción' },
      { t0: 12, t1: 15, texto: 'segunda frase, con coma' },
      { t0: 30, t1: 33, texto: 'frase tras el instrumental' },
    ];
    const acs = [ac('A', 0, 12), ac('E', 12, 20), ac('F#m', 20, 40)];
    const cifrado = construirCifradoSincronizado(lineas, acs);
    const mapa = asociarLineasConLetra(cifrado, lineas);
    expect(mapa.filter((k) => k !== null)).toEqual([0, 1, 2]);
    // y la línea asociada es realmente esa
    const filas = cifrado.split('\n');
    mapa.forEach((k, i) => {
      if (k !== null) expect(filas[i].replace(/\[[^\]]+\]/g, '')).toBe(lineas[k].texto);
    });
  });
});

describe('ningún acorde del audio se pierde en el cifrado (el resaltado no se salta ninguno)', () => {
  const verso = (t0: number, t1: number, texto: string) => ({ t0, t1, texto });
  const acordesDe = (cifrado: string) => acordesDelCifrado(cifrado);

  it('tres acordes en una misma línea corta salen los tres, aunque caigan sobre la misma palabra', () => {
    const t = construirCifradoSincronizado(
      [verso(0, 3, 'solo dos palabras')],
      [ac('Em', 0, 1), ac('C', 1, 1.1), ac('G', 1.1, 3)],
    );
    expect(acordesDe(t)).toEqual(['Em', 'C', 'G']);
  });

  it('los cambios que ocurren en la pausa entre dos frases se escriben al principio de la siguiente', () => {
    const t = construirCifradoSincronizado(
      [verso(0, 2, 'primera frase'), verso(3.5, 5.5, 'segunda frase')],
      [ac('Am', 0, 2.2), ac('F', 2.2, 3), ac('C', 3, 5.5)],
    );
    expect(acordesDe(t)).toEqual(['Am', 'F', 'C']);
    expect(t.split('\n').pop()).toMatch(/^\[F\]\[C\]segunda frase$|^\[F\]\[C\]/);
  });

  it('un cambio en el último instante de una frase no se pierde', () => {
    const t = construirCifradoSincronizado(
      [verso(0, 4, 'una frase larga'), verso(4.5, 8, 'otra frase')],
      [ac('D', 0, 3.95), ac('A', 3.95, 8)],
    );
    expect(acordesDe(t)).toEqual(['D', 'A']);
  });

  it('el cifrado resultante casa al 100 % con el audio y cada acorde del texto tiene su tramo', () => {
    const segs = [ac('F#m', 0, 2), ac('Bm', 2, 3), ac('E', 3, 3.4), ac('F#m', 3.4, 6), ac('Bm', 6, 8)];
    const t = construirCifradoSincronizado([verso(0.2, 3.2, 'hijos trabajo casa'), verso(3.6, 7.5, 'ropa bonita coche')], segs);
    const al = alinearCifradoConAudio(t, segs)!;
    expect(al.calidad).toBe(1);
    expect(al.pares.every((p) => p.segmento !== null)).toBe(true);
  });
});
