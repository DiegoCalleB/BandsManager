// El texto de un cartel impreso no es un relleno perfecto: la tinta falla en motas, hay zonas con menos carga y un
// borde que no es de vector. Aquí el título se pinta en una capa aparte y se le quitan unas motas de tinta,
// deterministas por semilla, para que se lea como impreso junto al arte y no como una capa digital encima.

import type { Rect } from './layoutBase';

function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Motas de tinta que faltan: muchas pequeñas y pocas zonas flojas. Nunca borra más de ~4 % del texto. */
export function motasDeTinta(ancho: number, alto: number, u: number, semilla: number): Array<{ x: number; y: number; r: number; a: number }> {
  const azar = mulberry32(semilla);
  const area = ancho * alto;
  const motas: Array<{ x: number; y: number; r: number; a: number }> = [];
  const pequenas = Math.round((area * 0.0009) / (u * u));
  for (let i = 0; i < pequenas; i++) motas.push({ x: azar() * ancho, y: azar() * alto, r: (0.5 + azar() * 1.1) * u, a: 0.5 + azar() * 0.5 });
  const flojas = Math.max(2, Math.round(area / (90000 * u * u)));
  for (let i = 0; i < flojas; i++) motas.push({ x: azar() * ancho, y: azar() * alto, r: (3 + azar() * 3.5) * u, a: 0.3 + azar() * 0.2 });
  return motas;
}

/**
 * Pinta con `trazar` (que dibuja con coordenadas del lienzo) dentro de `caja`, en una capa aparte a la que se le
 * quitan las motas de tinta, y la pone encima. Si no hay DOM o el canvas falla, pinta directo.
 */
export function pintarConDesgaste(ctx: CanvasRenderingContext2D, caja: Rect, semilla: number, u: number, trazar: (c: CanvasRenderingContext2D) => void): void {
  const pad = Math.round(6 * u);
  const x0 = Math.max(0, Math.floor(caja.x - pad));
  const y0 = Math.max(0, Math.floor(caja.y - pad));
  const w = Math.min(ctx.canvas.width - x0, Math.ceil(caja.w + pad * 2));
  const h = Math.min(ctx.canvas.height - y0, Math.ceil(caja.h + pad * 2));
  if (typeof document === 'undefined' || w < 2 || h < 2) return trazar(ctx);
  const capa = document.createElement('canvas');
  capa.width = w;
  capa.height = h;
  const c = capa.getContext('2d');
  if (!c) return trazar(ctx);
  c.translate(-x0, -y0);
  c.textBaseline = ctx.textBaseline;
  c.textAlign = ctx.textAlign;
  trazar(c);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'destination-out';
  for (const m of motasDeTinta(w, h, u, semilla)) {
    c.fillStyle = `rgba(0,0,0,${m.a.toFixed(2)})`;
    c.beginPath();
    c.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    c.fill();
  }
  ctx.drawImage(capa, x0, y0);
}
