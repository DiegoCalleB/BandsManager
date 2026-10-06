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
