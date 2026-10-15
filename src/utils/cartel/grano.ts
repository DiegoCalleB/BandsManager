// Grano de papel: el acabado que se pone sobre un fondo de IA para que no tenga el aspecto liso,
// «de plástico», de una imagen generada. Un fondo impreso de verdad tiene fibra de papel y tinta
// irregular. Pura y determinista (misma semilla → mismo grano): el cartel de la vista previa y el
// exportado son idénticos y el A4 no cambia de textura entre descargas.
//
// No sustituye a las reglas del prompt (server/utils/promptCartel.ts): las completa. No oculta ni
// elimina nada de la imagen original, solo le añade textura encima.

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

export function semillaDeTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Baldosa `lado`×`lado` de ruido en RGBA (gris, opaco). Mezcla dos escalas: un grano fino de fibra y
 * unas manchas suaves de tinta desigual, para que no se note la repetición de la baldosa.
 */
export function generarGrano(lado: number, semilla: number): Uint8ClampedArray {
  const azar = mulberry32(semilla);
  const fino = new Float32Array(lado * lado);
  for (let i = 0; i < fino.length; i++) fino[i] = azar();

  // Manchas: ruido de baja resolución (cuadrícula de 8×8) interpolado a toda la baldosa.
  const celdas = 8;
  const rejilla = Array.from({ length: celdas * celdas }, () => azar());
  const mancha = (x: number, y: number) => {
    const fx = (x / lado) * celdas;
    const fy = (y / lado) * celdas;
    const x0 = Math.floor(fx) % celdas;
    const y0 = Math.floor(fy) % celdas;
    const x1 = (x0 + 1) % celdas; // se cierra sobre sí misma: la baldosa encaja con sus vecinas
    const y1 = (y0 + 1) % celdas;
    const tx = fx - Math.floor(fx);
    const ty = fy - Math.floor(fy);
    const a = rejilla[y0 * celdas + x0] * (1 - tx) + rejilla[y0 * celdas + x1] * tx;
    const b = rejilla[y1 * celdas + x0] * (1 - tx) + rejilla[y1 * celdas + x1] * tx;
    return a * (1 - ty) + b * ty;
  };

  const out = new Uint8ClampedArray(lado * lado * 4);
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const i = y * lado + x;
      const v = 0.75 * fino[i] + 0.25 * mancha(x, y);
      const g = Math.round(v * 255);
      out[i * 4] = g;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = g;
      out[i * 4 + 3] = 255;
    }
  }
  return out;
}

const LADO = 256;

/**
 * Pinta el grano encima de lo que ya hay en el lienzo, a `ancho` píxeles (el mismo aspecto a 1080 y
 * a 2480: el tamaño del grano escala con el cartel). `intensidad` 0..1.
 */
export function aplicarGrano(ctx: CanvasRenderingContext2D, ancho: number, alto: number, semilla: number, intensidad = 0.14): void {
  const baldosa = document.createElement('canvas');
  baldosa.width = LADO;
  baldosa.height = LADO;
  const bctx = baldosa.getContext('2d');
  if (!bctx) return;
  const datos = new ImageData(generarGrano(LADO, semilla), LADO, LADO);
  bctx.putImageData(datos, 0, 0);

  const patron = ctx.createPattern(baldosa, 'repeat');
  if (!patron) return;
  const u = ancho / 1080;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = intensidad;
  ctx.scale(u, u); // la baldosa se escala con el cartel
  ctx.fillStyle = patron;
  ctx.fillRect(0, 0, ancho / u, alto / u);
  ctx.restore();
}
