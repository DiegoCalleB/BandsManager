import { describe, it, expect } from 'vitest';
import { encajarImagen, MAX_CORTE } from '../ventana';

const ventana = { x: 18, y: 300, w: 1044, h: 620 };

describe('encajarImagen', () => {
  it('una ilustración apaisada llena la ventana y recorta poco, centrada', () => {
    const e = encajarImagen(1024, 768, ventana);
    expect(e).toMatchObject({ dx: ventana.x, dy: ventana.y, dw: ventana.w, dh: ventana.h });
    // Se ve el ancho completo y se recorta el sobrante arriba y abajo, a partes iguales.
    expect(e.sx).toBe(0);
    expect(e.sw).toBe(1024);
    expect(e.sy).toBeGreaterThan(0);
    expect(e.sy + e.sh).toBeCloseTo(768 - e.sy, 5);
    expect(e.sh / 768).toBeGreaterThan(1 - MAX_CORTE);
  });

  it('el recorte nunca pasa del máximo permitido en ningún eje', () => {
    for (const [w, h] of [[1024, 768], [1200, 800], [1000, 1000], [900, 1200], [768, 1344], [2000, 600]]) {
      const e = encajarImagen(w, h, ventana);
      expect(e.sw / w).toBeGreaterThanOrEqual(1 - MAX_CORTE - 1e-9);
      expect(e.sh / h).toBeGreaterThanOrEqual(1 - MAX_CORTE - 1e-9);
    }
  });

  it('una ilustración vertical (de antes) en una ventana apaisada se pinta ENTERA y centrada, con papel a los lados', () => {
    const e = encajarImagen(768, 1344, ventana);
    expect([e.sx, e.sy, e.sw, e.sh]).toEqual([0, 0, 768, 1344]);
    expect(e.dh).toBeCloseTo(ventana.h, 5);
    expect(e.dw).toBeLessThan(ventana.w);
    expect(e.dx + e.dw / 2).toBeCloseTo(ventana.x + ventana.w / 2, 5);
    expect(e.dx).toBeGreaterThanOrEqual(ventana.x);
    expect(e.dx + e.dw).toBeLessThanOrEqual(ventana.x + ventana.w + 1e-9);
  });

  it('en una ventana casi cuadrada (historia) una 4:3 recorta los lados dentro del margen', () => {
    const casiCuadrada = { x: 18, y: 330, w: 1044, h: 1100 };
    const e = encajarImagen(1024, 768, casiCuadrada);
    expect(e.dw).toBe(casiCuadrada.w);
    expect(e.sw / 1024).toBeGreaterThan(0.7);
    expect(e.sh).toBe(768);
  });

  it('siempre pinta dentro de la ventana', () => {
    for (const [w, h] of [[1024, 768], [768, 1344], [500, 500], [3000, 400]]) {
      const e = encajarImagen(w, h, ventana);
      expect(e.dx).toBeGreaterThanOrEqual(ventana.x - 1e-9);
      expect(e.dy).toBeGreaterThanOrEqual(ventana.y - 1e-9);
      expect(e.dx + e.dw).toBeLessThanOrEqual(ventana.x + ventana.w + 1e-9);
      expect(e.dy + e.dh).toBeLessThanOrEqual(ventana.y + ventana.h + 1e-9);
    }
  });

  it('con un máximo de corte de 0 nunca recorta: siempre entera', () => {
    const e = encajarImagen(1024, 768, ventana, 0);
    expect([e.sx, e.sy, e.sw, e.sh]).toEqual([0, 0, 1024, 768]);
  });
});
