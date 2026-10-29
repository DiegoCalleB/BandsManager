import { describe, it, expect } from 'vitest';
import { detectarMarco } from '../marco';

/** Imagen RGBA sintética: `fondo` por todas partes y un rectángulo de `arte` (fracciones) encima. */
function imagen(ancho: number, alto: number, fondo: [number, number, number], arte?: { x: number; y: number; w: number; h: number; color: [number, number, number] }) {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dentro = !!arte && x >= arte.x * ancho && x < (arte.x + arte.w) * ancho && y >= arte.y * alto && y < (arte.y + arte.h) * alto;
      const c = dentro ? arte!.color : fondo;
      d.set([...c, 255], (y * ancho + x) * 4);
    }
  }
  return d;
}
const CREMA: [number, number, number] = [236, 226, 200];
const AZUL: [number, number, number] = [30, 40, 70];

describe('detectarMarco', () => {
  it('encuentra el arte dentro de un marco de papel crema', () => {
    const d = imagen(150, 200, CREMA, { x: 0.13, y: 0.07, w: 0.74, h: 0.86, color: AZUL });
    const r = detectarMarco(d, 150, 200)!;
    expect(r.x).toBeCloseTo(0.13, 1);
    expect(r.y).toBeCloseTo(0.07, 1);
    expect(r.w).toBeCloseTo(0.74, 1);
    expect(r.h).toBeCloseTo(0.86, 1);
  });

  it('no toca una ilustración que llega al borde', () => {
    expect(detectarMarco(imagen(150, 200, AZUL), 150, 200)).toBeNull();
    expect(detectarMarco(imagen(150, 200, CREMA, { x: 0, y: 0, w: 1, h: 1, color: AZUL }), 150, 200)).toBeNull();
  });

  it('no toca un papel claro con un motivo pequeño (no hay un rectángulo de arte)', () => {
    expect(detectarMarco(imagen(150, 200, CREMA, { x: 0.4, y: 0.4, w: 0.2, h: 0.2, color: AZUL }), 150, 200)).toBeNull();
  });

  it('no toca un papel claro con una franja de título (un lado no es marco)', () => {
    expect(detectarMarco(imagen(150, 200, CREMA, { x: 0.1, y: 0.3, w: 0.8, h: 0.1, color: AZUL }), 150, 200)).toBeNull();
  });

  it('un marco demasiado fino o demasiado ancho no cuenta', () => {
    expect(detectarMarco(imagen(150, 200, CREMA, { x: 0.005, y: 0.005, w: 0.99, h: 0.99, color: AZUL }), 150, 200)).toBeNull();
    expect(detectarMarco(imagen(150, 200, CREMA, { x: 0.35, y: 0.35, w: 0.3, h: 0.3, color: AZUL }), 150, 200)).toBeNull();
  });

  it('un marco oscuro no es papel: se deja', () => {
    expect(detectarMarco(imagen(150, 200, [40, 40, 40], { x: 0.1, y: 0.1, w: 0.8, h: 0.8, color: [200, 190, 170] }), 150, 200)).toBeNull();
  });

  it('con datos que no cuadran devuelve null', () => {
    expect(detectarMarco(new Uint8ClampedArray(10), 150, 200)).toBeNull();
    expect(detectarMarco(new Uint8ClampedArray(0), 5, 5)).toBeNull();
  });
});
