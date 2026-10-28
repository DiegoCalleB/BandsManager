// Cartel para imprenta: el A4 con sangrado (el arte sigue 3 mm más allá del corte) y marcas de corte en los
// bordes. La geometría es pura y se prueba aparte; el dibujo solo usa la API de canvas.

/** A4 a 300 ppp: milímetros a píxeles. */
export const mmAPx = (mm: number, ppp = 300) => Math.round((mm * ppp) / 25.4);

export interface MedidasSangrado {
  /** Cuánto se prolonga el arte más allá del corte (px). */
  sangre: number;
  /** Margen blanco exterior donde van las marcas (px). */
  margen: number;
  /** Separación entre el borde del sangrado y el inicio de cada marca (px). */
  hueco: number;
  /** Largo de cada marca (px). */
  largo: number;
}

export const SANGRADO_A4: MedidasSangrado = { sangre: mmAPx(3), margen: mmAPx(7), hueco: mmAPx(1), largo: mmAPx(4) };

export type Marca = [x0: number, y0: number, x1: number, y1: number];

/** Tamaño del lienzo final para un cartel de `w`×`h` px al corte. */
export const lienzoConSangrado = (w: number, h: number, m: MedidasSangrado = SANGRADO_A4) => ({
  ancho: w + 2 * (m.margen + m.sangre),
  alto: h + 2 * (m.margen + m.sangre),
  /** Esquina superior izquierda del corte dentro del lienzo final. */
  corteX: m.margen + m.sangre,
  corteY: m.margen + m.sangre,
});

/** Las ocho marcas de corte (dos por esquina), en coordenadas del lienzo final. */
export function marcasDeCorte(w: number, h: number, m: MedidasSangrado = SANGRADO_A4): Marca[] {
  const { corteX, corteY } = lienzoConSangrado(w, h, m);
  const salto = m.sangre + m.hueco;
  const marcas: Marca[] = [];
  for (const [cx, sx] of [[corteX, -1], [corteX + w, 1]] as const) {
    for (const [cy, sy] of [[corteY, -1], [corteY + h, 1]] as const) {
      marcas.push([cx + sx * salto, cy, cx + sx * (salto + m.largo), cy]);
      marcas.push([cx, cy + sy * salto, cx, cy + sy * (salto + m.largo)]);
    }
  }
  return marcas;
}

/**
 * Cartel con sangrado y marcas: el original queda centrado y su borde se prolonga hacia fuera repitiendo la última
 * fila/columna de píxeles (las esquinas, con el píxel de la esquina). No inventa arte: es el sangrado que necesita
 * una guillotina con un pequeño error, no un recorte creativo.
 */
export function conSangradoYMarcas(origen: HTMLCanvasElement, m: MedidasSangrado = SANGRADO_A4): HTMLCanvasElement {
  const w = origen.width;
  const h = origen.height;
  const { ancho, alto, corteX, corteY } = lienzoConSangrado(w, h, m);
  const out = document.createElement('canvas');
  out.width = ancho;
  out.height = alto;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no puede preparar el PDF de imprenta.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingEnabled = false;
  const s = m.sangre;
  // Lados: la fila/columna del borde, estirada.
  ctx.drawImage(origen, 0, 0, w, 1, corteX, corteY - s, w, s);
  ctx.drawImage(origen, 0, h - 1, w, 1, corteX, corteY + h, w, s);
  ctx.drawImage(origen, 0, 0, 1, h, corteX - s, corteY, s, h);
  ctx.drawImage(origen, w - 1, 0, 1, h, corteX + w, corteY, s, h);
  // Esquinas: el píxel de cada esquina.
  ctx.drawImage(origen, 0, 0, 1, 1, corteX - s, corteY - s, s, s);
  ctx.drawImage(origen, w - 1, 0, 1, 1, corteX + w, corteY - s, s, s);
  ctx.drawImage(origen, 0, h - 1, 1, 1, corteX - s, corteY + h, s, s);
  ctx.drawImage(origen, w - 1, h - 1, 1, 1, corteX + w, corteY + h, s, s);
  ctx.drawImage(origen, corteX, corteY);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, mmAPx(0.15));
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of marcasDeCorte(w, h, m)) {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
  return out;
}
