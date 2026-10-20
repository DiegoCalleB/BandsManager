/**
 * Firma discreta de BandManager bajo el QR de la banda: una Onda pequeña (barras de punta
 * redondeada, como el resto del producto) y «Hecho con bandmanager.io». Un solo gris, sin acento,
 * para que el QR y el logo de la banda sigan siendo lo primero que se ve. Una única pieza que
 * comparten el cartel impreso, los PNG y el SVG, así no se copia el texto en cada formato.
 */

/** Ancho de la firma respecto al lado del QR: se lee de cerca y no compite con él. */
export const MARCA_ANCHO = 0.4;
const ANCHO = 238;
const ALTO = 24;
const RATIO = ALTO / ANCHO;
const GRIS = '#94a3b8';
const BARRAS = [8, 14, 20, 12, 18, 10, 6];

/** Elementos de la firma en un espacio de 238 × 24; se anidan en un `<svg viewBox>`. */
function interior(): string {
  const barras = BARRAS.map((h, i) => `<rect x="${i * 7}" y="${(ALTO - h) / 2}" width="4" height="${h}" rx="2" fill="${GRIS}"/>`).join('');
  return `${barras}<text x="58" y="16.5" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="12" font-weight="600" letter-spacing="0.3" fill="${GRIS}">Hecho con bandmanager.io</text>`;
}

/** SVG autónomo de la firma, para el cartel HTML y para dibujarlo en un canvas. */
export function buildMarcaSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" shape-rendering="geometricPrecision" role="img" aria-label="Hecho con bandmanager.io">${interior()}</svg>`;
}

/** Firma anidada dentro del SVG del QR: centrada en x y con `y` como borde superior. */
export function marcaAnidada(centroX: number, y: number, ancho: number): string {
  return `<svg x="${centroX - ancho / 2}" y="${y}" width="${ancho}" height="${ancho * RATIO}" viewBox="0 0 ${ANCHO} ${ALTO}" shape-rendering="geometricPrecision">${interior()}</svg>`;
}

/** Alto de la franja que la firma añade bajo el QR, en la misma unidad que `ancho`. */
export const altoMarca = (ancho: number): number => ancho * RATIO;

/** Dibuja la firma en un canvas, centrada en `centroX`, con `y` como borde superior. */
export async function dibujarMarca(ctx: CanvasRenderingContext2D, centroX: number, y: number, ancho: number): Promise<void> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildMarcaSvg())}`;
  });
  if (img) ctx.drawImage(img, centroX - ancho / 2, y, ancho, ancho * RATIO);
}
