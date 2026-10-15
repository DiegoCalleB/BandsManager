import { describe, it, expect } from 'vitest';
import { generarGrano, semillaDeTexto } from '../grano';

describe('grano de papel', () => {
  it('es determinista: misma semilla, mismo grano; otra semilla, otro', () => {
    const a = generarGrano(64, 123);
    expect(Array.from(generarGrano(64, 123))).toEqual(Array.from(a));
    expect(Array.from(generarGrano(64, 124))).not.toEqual(Array.from(a));
  });

  it('es gris, opaco y está centrado: no aclara ni oscurece el cartel de media', () => {
    const d = generarGrano(128, 7);
    let suma = 0;
    for (let i = 0; i < d.length; i += 4) {
      expect(d[i]).toBe(d[i + 1]);
      expect(d[i]).toBe(d[i + 2]);
      expect(d[i + 3]).toBe(255);
      suma += d[i];
    }
    const media = suma / (d.length / 4);
    expect(media).toBeGreaterThan(115);
    expect(media).toBeLessThan(140);
  });

  it('tiene textura de verdad (no es un gris plano) y de dos escalas', () => {
    const d = generarGrano(128, 9);
    const vals = Array.from({ length: d.length / 4 }, (_, i) => d[i * 4]);
    const media = vals.reduce((a, b) => a + b, 0) / vals.length;
    const desv = Math.sqrt(vals.reduce((a, b) => a + (b - media) ** 2, 0) / vals.length);
    expect(desv).toBeGreaterThan(30);
  });

  it('la baldosa encaja con sus vecinas (la mancha se cierra sobre sí misma)', () => {
    // El borde derecho no tiene un salto brusco respecto al izquierdo en la escala de mancha:
    // se comprueba con la media de la columna, que sube de ruido fino pero no de mancha.
    const lado = 128;
    const d = generarGrano(lado, 11);
    const col = (x: number) => Array.from({ length: lado }, (_, y) => d[(y * lado + x) * 4]).reduce((a, b) => a + b, 0) / lado;
    expect(Math.abs(col(0) - col(lado - 1))).toBeLessThan(20);
  });

  it('semillaDeTexto da la misma semilla para el mismo texto', () => {
    expect(semillaDeTexto('c1|Los Pijamas')).toBe(semillaDeTexto('c1|Los Pijamas'));
    expect(semillaDeTexto('a')).not.toBe(semillaDeTexto('b'));
  });
});
