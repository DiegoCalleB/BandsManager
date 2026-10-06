import { describe, it, expect } from 'vitest';
import { acordesDelCifrado, esTokenAcorde, transponerAcorde, alinearCifradoConAudio, acordeActivoDelCifrado } from '../alineacionAcordes';

const seg = (acordes: string[], dur = 2) =>
  acordes.map((a, i) => ({ t0: i * dur, t1: (i + 1) * dur, acorde: a, confianza: 0.8 }));

describe('acordesDelCifrado', () => {
  it('ignora cabeceras de sección y normaliza a notación internacional', () => {
    const t = '[Intro]\n[Mim] [Do] [Sol] [Re]\n[Verso 1]\n[Lam] Letra [Solo] más';
    expect(acordesDelCifrado(t)).toEqual(['Em', 'C', 'G', 'D', 'Am']);
  });
  it('una línea que empieza por cabecera se trata como cabecera, igual que en el visor', () => {
    expect(acordesDelCifrado('[Intro] [Am] [G]\n[Em]')).toEqual(['Em']);
  });
  it('[Solo] es sección, no «Sol» + o', () => {
    expect(esTokenAcorde('Solo')).toBe(false);
    expect(esTokenAcorde('Sol')).toBe(true);
    expect(esTokenAcorde('Verso 2')).toBe(false);
    expect(esTokenAcorde('Estribillo')).toBe(false);
  });
});

describe('transponerAcorde', () => {
  it.each([['C', 2, 'D'], ['Am7', 3, 'Cm7'], ['G/B', 5, 'C/E'], ['F#m', 1, 'Gm'], ['B', 1, 'C']])('%s +%s → %s', (a, s, e) => {
    expect(transponerAcorde(a as string, s as number)).toBe(e);
  });
});

describe('alinearCifradoConAudio', () => {
  it('alinea una progresión idéntica, acorde a acorde', () => {
    const al = alinearCifradoConAudio('[Em] [C] [G] [D]', seg(['Em', 'C', 'G', 'D']))!;
    expect(al.usable).toBe(true);
    expect(al.calidad).toBe(1);
    expect(al.desplazamiento).toBe(0);
    expect(al.pares.map((p) => p.segmento)).toEqual([0, 1, 2, 3]);
  });

  it('el audio repite el estribillo y el cifrado lo escribe una vez: casa con la primera vez', () => {
    const cifrado = '[Em] [C] [G] [D] [Am] [C]';
    const audio = seg(['Em', 'C', 'G', 'D', 'Am', 'C', 'Em', 'C', 'G', 'D', 'Am', 'C']);
    const al = alinearCifradoConAudio(cifrado, audio)!;
    expect(al.usable).toBe(true);
    expect(al.pares.map((p) => p.segmento)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('salta los «N» y las repeticiones consecutivas del audio', () => {
    const audio = [
      { t0: 0, t1: 1, acorde: 'Em', confianza: 1 }, { t0: 1, t1: 2, acorde: 'Em', confianza: 1 },
      { t0: 2, t1: 3, acorde: 'N', confianza: 0 },
      { t0: 3, t1: 4, acorde: 'C', confianza: 1 }, { t0: 4, t1: 5, acorde: 'G', confianza: 1 },
    ];
    const al = alinearCifradoConAudio('[Em] [C] [G]', audio)!;
    expect(al.pares.map((p) => p.segmento)).toEqual([0, 3, 4]);
  });

  it('detecta un cifrado escrito en otra tonalidad que la grabación', () => {
    // Cifrado en Am-F-C-G; el audio suena un tono por debajo (Gm-Eb... → +? ) → probamos +2: Am→Bm no. Usamos +3.
    const cifrado = '[Am] [F] [C] [G]';
    const audio = seg(['Cm', 'G#', 'D#', 'A#']); // +3 semitonos
    const al = alinearCifradoConAudio(cifrado, audio)!;
    expect(al.desplazamiento).toBe(3);
    expect(al.usable).toBe(true);
  });

  it('tolera extensiones (Am7 ≈ Am) y un cambio mal detectado', () => {
    const al = alinearCifradoConAudio('[Am7] [F] [C] [G]', seg(['Am', 'F', 'D', 'G']))!;
    expect(al.pares[0].coincide).toBe(true);
    expect(al.pares[2].coincide).toBe(false); // C del cifrado vs D detectado: casa por posición pero difiere
    expect(al.pares[2].segmento).toBe(2);
    expect(al.usable).toBe(true); // 3 de 4 coinciden
  });

  it('no es utilizable si el cifrado y el audio no se parecen (mismas raíces, otra calidad)', () => {
    const al = alinearCifradoConAudio('[Cm] [Dm] [Em] [Fm]', seg(['C', 'D', 'E', 'F']))!;
    expect(al.calidad).toBe(0);
    expect(al.usable).toBe(false);
  });

  it('devuelve null sin material suficiente', () => {
    expect(alinearCifradoConAudio('Sin acordes aquí', seg(['C', 'G']))).toBeNull();
    expect(alinearCifradoConAudio('[C] [G]', seg(['C']))).toBeNull();
  });
});

describe('calidad con material desigual', () => {
  it('un cifrado largo frente a un audio corto no penaliza si lo que hay del audio casa', () => {
    const cifrado = '[Em] [C] [D] [Em] [Em] [C] [D] [Em] [G] [D] [Em] [C] [G] [D] [Em] [C]';
    const al = alinearCifradoConAudio(cifrado, seg(['Em', 'C', 'D', 'Em']))!;
    expect(al.calidad).toBe(1);
    expect(al.usable).toBe(true);
  });
});

describe('acordeActivoDelCifrado', () => {
  it('devuelve el último acorde del cifrado cuyo tramo ya ha empezado', () => {
    const al = alinearCifradoConAudio('[Em] [C] [G] [D]', seg(['Em', 'C', 'G', 'D']))!;
    expect(acordeActivoDelCifrado(al, 0)).toBe(0);
    expect(acordeActivoDelCifrado(al, 2)).toBe(2);
    expect(acordeActivoDelCifrado(al, 3)).toBe(3);
    expect(acordeActivoDelCifrado(al, -1)).toBe(-1);
    expect(acordeActivoDelCifrado(null, 2)).toBe(-1);
  });
});

import { asociarLineasConLetra } from '../alineacionAcordes';

describe('asociarLineasConLetra (karaoke: cada línea del cifrado sabe cuándo suena)', () => {
  const letra = [{ texto: 'A miña máquina funcionou' }, { texto: 'Non me culpes' }, { texto: 'Erros por todas partes' }];

  it('asocia por texto sin acordes, ignorando cabeceras, líneas de solo acordes y puntuación', () => {
    const cifrado = ['[Intro]', '[A] [E]', '', '[A]A miña máquina funcionou', '[E]Non me, culpes!', '', '[Verso 2]', '[F#m]Erros por todas partes'].join('\n');
    expect(asociarLineasConLetra(cifrado, letra)).toEqual([null, null, null, 0, 1, null, null, 2]);
  });

  it('tolera una línea borrada por la banda (salta hasta 3 por delante)', () => {
    expect(asociarLineasConLetra('A miña máquina funcionou\nErros por todas partes', letra)).toEqual([0, 2]);
  });

  it('una línea que la banda reescribió no se asocia, y no desalinea las siguientes', () => {
    expect(asociarLineasConLetra('A miña máquina funcionou\nOtra cosa distinta\nNon me culpes', letra)).toEqual([0, null, 1]);
  });

  it('sin letra transcrita todo es null', () => {
    expect(asociarLineasConLetra('[A]hola\n[E]mundo', [])).toEqual([null, null]);
  });
});

describe('acordes repetidos y sin pareja: el resaltado no se salta ninguno', () => {
  const s = (acorde: string, t0: number, t1: number) => ({ t0, t1, acorde, confianza: 1 });

  it('el mismo acorde dos veces seguidas (separado por un silencio) conserva sus dos tramos', () => {
    const cifrado = '[Am] uno [F] dos [C] tres [C] cuatro [G] cinco';
    const segs = [s('Am', 0, 2), s('F', 2, 4), s('C', 4, 6), s('N', 6, 7), s('C', 7, 9), s('G', 9, 11)];
    const al = alinearCifradoConAudio(cifrado, segs)!;
    expect(al.pares.map((p) => p.segmento)).toEqual([0, 1, 2, 4, 5]);
    // Recorriendo el audio, el cursor pasa por los cinco acordes del texto, ninguno se salta.
    const activos = [1, 3, 5, 8, 10].map((t) => acordeActivoDelCifrado(al, segs.findIndex((x) => t >= x.t0 && t < x.t1)));
    expect(activos).toEqual([0, 1, 2, 3, 4]);
  });

  it('un acorde del texto que el audio detectó distinto recibe el tramo que cae entre sus vecinos', () => {
    const cifrado = '[Am] a [F] b [Dm] c [G] d';
    const segs = [s('Am', 0, 2), s('F', 2, 4), s('A#', 4, 6), s('G', 6, 8)];
    const al = alinearCifradoConAudio(cifrado, segs)!;
    expect(al.pares[2].segmento).toBe(2);
    expect(al.pares[2].coincide).toBe(false);
    expect([1, 3, 5, 7].map((t) => acordeActivoDelCifrado(al, Math.floor(t / 2)))).toEqual([0, 1, 2, 3]);
  });
});

describe('acordeActivoPorTiempo con tiempos repetidos', () => {
  it('al empezar (todos a 0 s) activa el primer acorde, no el último del empate', async () => {
    const { acordeActivoPorTiempo } = await import('../alineacionAcordes');
    expect(acordeActivoPorTiempo([0, 0, 0, 0, 2.5, 5], 0)).toBe(0);
    expect(acordeActivoPorTiempo([0, 0, 0, 0, 2.5, 5], 3)).toBe(4);
  });
});

describe('tanda de acordes iguales frente a un solo tramo del audio', () => {
  it('el tramo se ancla al primero de la tanda y los repetidos usan el inicio de su frase', async () => {
    const { tiemposDeAcordes } = await import('../alineacionAcordes');
    const cifrado = '[Em] uno\n[Em] dos\n[Em] tres\n[A] cuatro';
    const segs = [
      { t0: 10, t1: 16, acorde: 'Em', confianza: 0.8 },
      { t0: 16, t1: 20, acorde: 'A', confianza: 0.8 },
    ];
    const al = alinearCifradoConAudio(cifrado, segs)!;
    expect(al.pares[0].segmento).toBe(0);
    expect(al.pares[1].segmento).not.toBe(0);
    const t = tiemposDeAcordes(al, segs, [0, 12, 14, 16].map((x, i) => (i === 0 ? 10 : x)));
    expect(t.slice(0, 3)).toEqual([10, 12, 14]);
    expect(t[3]).toBe(16);
  });
});
