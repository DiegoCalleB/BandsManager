// Plantillas de autor: carteles ilustrados por código, sin IA y sin coste. Cada una es una pieza de oficio con su
// paleta cerrada (como una serigrafía de 3-4 tintas), y deja el centro para el motivo y arriba/abajo zonas calmadas
// donde va el texto. Puras y deterministas: la misma semilla (el bolo) da el mismo dibujo en la vista previa y en
// la exportación. La fibra de papel se añade después, igual que con un fondo de IA.

import { mulberry32 } from './grano';

export const PLANTILLAS = ['sol', 'circulos', 'montanas', 'vinilo', 'arcos', 'reticula'] as const;
export type PlantillaId = (typeof PLANTILLAS)[number];

export const ETIQUETA_PLANTILLA: Record<PlantillaId, string> = {
  sol: 'Sol retro',
  circulos: 'Círculos',
  montanas: 'Montañas',
  vinilo: 'Vinilo',
  arcos: 'Arcos',
  reticula: 'Retícula',
};

export const esPlantilla = (v: unknown): v is PlantillaId => typeof v === 'string' && (PLANTILLAS as readonly string[]).includes(v);

/** Color de papel de cada plantilla (para la miniatura y para medir tintas). */
export const PAPEL_PLANTILLA: Record<PlantillaId, string> = {
  sol: '#1B1B3A',
  circulos: '#F2E8D5',
  montanas: '#E9DCC3',
  vinilo: '#EDE3CF',
  arcos: '#F1E6CF',
  reticula: '#150A24',
};

/** La tinta oscura del texto sobre cada plantilla de papel claro (la más oscura de su paleta, no un negro de ordenador). */
export const TINTA_PLANTILLA: Record<PlantillaId, string> = {
  sol: '#F4EEE0',
  circulos: '#1F1B2E',
  montanas: '#12283A',
  vinilo: '#161412',
  arcos: '#1D2D44',
  reticula: '#F4EEE0',
};

type Ctx = CanvasRenderingContext2D;
type Azar = () => number;

const entre = (azar: Azar, a: number, b: number) => a + (b - a) * azar();

/** Una cresta de montañas: línea quebrada de `pasos` puntos con altura `base ± relieve`, de lado a lado. */
function cresta(azar: Azar, w: number, base: number, relieve: number, pasos: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  let sube = azar() > 0.5;
  for (let i = 0; i <= pasos; i++) {
    const x = (w * i) / pasos;
    const y = base + (sube ? -1 : 1) * relieve * (0.35 + 0.65 * azar());
    pts.push([x, y]);
    sube = !sube;
  }
  return pts;
}

function poligono(ctx: Ctx, pts: Array<[number, number]>, cierreY: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, cierreY);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], cierreY);
  ctx.closePath();
  ctx.fill();
}

function sol(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.sol;
  ctx.fillRect(0, 0, w, h);
  const cx = w * (0.5 + entre(azar, -0.04, 0.04));
  const cy = h * 0.47;
  const r = w * 0.27;
  // Disco en franjas de tinta plana, de amarillo arriba a magenta abajo, con rendijas que crecen hacia abajo.
  const tintas = ['#FFD15C', '#FBA94B', '#F57F4F', '#EA5A5F', '#D9406E'];
  const franjas = 22;
  for (let i = 0; i < franjas; i++) {
    const t = i / franjas;
    const y0 = cy - r + t * 2 * r;
    const y1 = cy - r + ((i + 1) / franjas) * 2 * r;
    const rendija = t > 0.45 ? (t - 0.45) * 1.7 : 0;
    const alto = (y1 - y0) * (1 - rendija);
    if (alto <= 0.5) continue;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = tintas[Math.min(tintas.length - 1, Math.floor(t * tintas.length))];
    ctx.fillRect(cx - r, y0, 2 * r, alto + 1);
    ctx.restore();
  }
  // Horizonte de montañas oscuras y suelo con líneas de fuga.
  const horizonte = h * 0.62;
  poligono(ctx, cresta(azar, w, horizonte, h * 0.055, 14), h * 0.7, '#0E0E24');
  poligono(ctx, cresta(azar, w, horizonte + h * 0.025, h * 0.04, 22), h * 0.7, '#12122E');
  ctx.fillStyle = '#0B0B1E';
  ctx.fillRect(0, h * 0.655, w, h * 0.345);
  ctx.strokeStyle = 'rgba(217,64,110,0.55)';
  ctx.lineWidth = Math.max(1, w * 0.0016);
  for (let i = 0; i <= 14; i++) {
    const x = (w * i) / 14;
    ctx.beginPath();
    ctx.moveTo(w / 2 + (x - w / 2) * 0.12, h * 0.655);
    ctx.lineTo(w / 2 + (x - w / 2) * 2.1, h);
    ctx.stroke();
  }
  for (let i = 1; i <= 7; i++) {
    const y = h * 0.655 + (h * 0.345) * Math.pow(i / 7, 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function circulos(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.circulos;
  ctx.fillRect(0, 0, w, h);
  const r = w * 0.235;
  const cx = w / 2 + entre(azar, -0.03, 0.03) * w;
  const cy = h * 0.46;
  const sep = r * 0.78;
  const discos: Array<[number, number, string]> = [
    [cx - sep * 0.9, cy + sep * 0.45, '#EE4B8B'],
    [cx + sep * 0.9, cy + sep * 0.45, '#2D5BD0'],
    [cx, cy - sep * 0.75, '#F6C21A'],
  ];
  // Tintas que se superponen como en una risografía: el solape se oscurece (multiply).
  ctx.globalCompositeOperation = 'multiply';
  for (const [x, y, c] of discos) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // Trama de puntos en un lado y un anillo fino que se sale del conjunto.
  ctx.fillStyle = '#1F1B2E';
  const paso = w * 0.022;
  for (let gy = 0; gy < 9; gy++) {
    for (let gx = 0; gx < 9; gx++) {
      const d = 1 - (gx + gy) / 16;
      ctx.beginPath();
      ctx.arc(w * 0.1 + gx * paso, h * 0.55 + gy * paso, paso * 0.42 * d, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#1F1B2E';
  ctx.lineWidth = w * 0.004;
  ctx.beginPath();
  ctx.arc(cx + sep * 1.25, cy - sep * 1.0, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

function montanas(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.montanas;
  ctx.fillRect(0, 0, w, h);
  // Sol plano detrás de las crestas.
  ctx.fillStyle = '#E8663D';
  ctx.beginPath();
  ctx.arc(w * (0.5 + entre(azar, -0.1, 0.1)), h * 0.42, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  const capas = ['#F0B27A', '#4F8A8B', '#2E5E73', '#1F3F58', '#12283A'];
  capas.forEach((c, i) => {
    const base = h * (0.46 + i * 0.075);
    poligono(ctx, cresta(azar, w, base, h * (0.1 - i * 0.012), 9 + i * 3), h * 0.9, c);
  });
  ctx.fillStyle = '#12283A';
  ctx.fillRect(0, h * 0.76, w, h * 0.24);
  // Pájaros mínimos.
  ctx.strokeStyle = '#12283A';
  ctx.lineWidth = w * 0.0035;
  for (let i = 0; i < 4; i++) {
    const x = w * (0.2 + i * 0.12 + azar() * 0.04);
    const y = h * (0.27 + azar() * 0.05);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.018, y);
    ctx.quadraticCurveTo(x - w * 0.009, y - w * 0.012, x, y);
    ctx.quadraticCurveTo(x + w * 0.009, y - w * 0.012, x + w * 0.018, y);
    ctx.stroke();
  }
}

function vinilo(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.vinilo;
  ctx.fillRect(0, 0, w, h);
  const cx = w * (0.5 + entre(azar, -0.03, 0.03));
  const cy = h * 0.47;
  const r = w * 0.31;
  // Sombra desplazada, como una tinta plana de otro color.
  ctx.fillStyle = '#D9C9A8';
  ctx.beginPath();
  ctx.arc(cx + w * 0.018, cy + w * 0.018, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#161412';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Surcos.
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (let i = 0; i < 26; i++) {
    const rr = r * (0.42 + (i / 26) * 0.55);
    ctx.strokeStyle = i % 5 === 0 ? 'rgba(237,227,207,0.2)' : 'rgba(237,227,207,0.07)';
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Brillos en dos cuñas.
  for (const a0 of [-0.9, 2.25]) {
    ctx.fillStyle = 'rgba(237,227,207,0.1)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.98, a0, a0 + 0.55);
    ctx.closePath();
    ctx.fill();
  }
  // Etiqueta central y agujero.
  ctx.fillStyle = '#D8412F';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F2C94C';
  ctx.lineWidth = w * 0.004;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PAPEL_PLANTILLA.vinilo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.035, 0, Math.PI * 2);
  ctx.fill();
  // Un brazo de tocadiscos que entra por la derecha.
  ctx.strokeStyle = '#161412';
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.moveTo(w * 0.93, h * 0.3);
  ctx.lineTo(w * 0.8, h * 0.3);
  ctx.lineTo(cx + r * 0.72, cy - r * 0.62);
  ctx.stroke();
  ctx.fillStyle = '#D8412F';
  ctx.beginPath();
  ctx.arc(w * 0.93, h * 0.3, w * 0.022, 0, Math.PI * 2);
  ctx.fill();
}

function arcos(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.arcos;
  ctx.fillRect(0, 0, w, h);
  const cx = w * (0.5 + entre(azar, -0.03, 0.03));
  const horizonte = h * 0.57;
  const tintas = ['#1D2D44', '#0E7C7B', '#F4B942', '#F26B38', '#D8412F'];
  const ancho = w * 0.05;
  const rMax = ancho * (tintas.length + 3) * 1.05;
  // Medios arcos concéntricos de fuera adentro: el último, el centro, es el sol.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, horizonte);
  ctx.clip();
  for (let i = 0; i < tintas.length + 3; i++) {
    const r = rMax - i * ancho;
    ctx.fillStyle = tintas[i % tintas.length];
    ctx.beginPath();
    ctx.arc(cx, horizonte, r, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
  // Reflejo: los mismos arcos, más tenues y encogidos, bajo el horizonte.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonte, w, h * 0.12);
  ctx.clip();
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < tintas.length + 3; i++) {
    const r = rMax - i * ancho;
    ctx.fillStyle = tintas[i % tintas.length];
    ctx.beginPath();
    ctx.arc(cx, horizonte + h * 0.012, r, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = PAPEL_PLANTILLA.arcos;
  for (let i = 0; i < 6; i++) ctx.fillRect(0, horizonte + h * (0.02 + i * 0.02), w, h * 0.009);
  ctx.fillStyle = '#1D2D44';
  ctx.fillRect(0, horizonte, w, Math.max(2, w * 0.004));
}

function reticula(ctx: Ctx, w: number, h: number, azar: Azar) {
  ctx.fillStyle = PAPEL_PLANTILLA.reticula;
  ctx.fillRect(0, 0, w, h);
  const cx = w * (0.5 + entre(azar, -0.05, 0.05));
  const cy = h * 0.46;
  const rMax = w * 0.4;
  const paso = w * 0.026;
  // Dos tintas con las tramas desplazadas: el solape se ilumina (screen) como luz sobre fondo oscuro.
  const capas: Array<[string, number, number]> = [
    ['#FF2E88', 0, 0],
    ['#27D3E6', paso * 0.5, paso * 0.5],
  ];
  ctx.globalCompositeOperation = 'screen';
  for (const [color, dx, dy] of capas) {
    ctx.fillStyle = color;
    for (let y = cy - rMax; y <= cy + rMax; y += paso) {
      for (let x = cx - rMax; x <= cx + rMax; x += paso) {
        const d = Math.hypot(x + dx - cx, y + dy - cy) / rMax;
        if (d > 1) continue;
        const rr = paso * 0.5 * Math.pow(1 - d, 0.75) * 1.05;
        if (rr < 0.6) continue;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

const DIBUJO: Record<PlantillaId, (ctx: Ctx, w: number, h: number, azar: Azar) => void> = { sol, circulos, montanas, vinilo, arcos, reticula };

/** El color con el que se prolonga cada plantilla hacia abajo en los formatos más altos (el de su borde inferior). */
const BASE_PLANTILLA: Record<PlantillaId, string> = {
  sol: '#0B0B1E',
  circulos: PAPEL_PLANTILLA.circulos,
  montanas: '#12283A',
  vinilo: PAPEL_PLANTILLA.vinilo,
  arcos: PAPEL_PLANTILLA.arcos,
  reticula: PAPEL_PLANTILLA.reticula,
};

/** Proporción alto/ancho para la que están pensadas las composiciones (el feed, 4:5, es 1,25: se queda algo más compacto). */
const ALTO_DISENO = 1.2;

/**
 * Dibuja la plantilla a pantalla completa (`w`×`h`). `semilla` fija las pequeñas variaciones de cada bolo.
 * El motivo se compone en una caja de como mucho 1,2 veces el ancho y se alinea arriba: en un A4 o una historia
 * (más altos) el motivo no baja hasta el bloque de texto, y lo que sobra se rellena con el color de su borde inferior.
 */
export function dibujarPlantilla(id: PlantillaId, ctx: Ctx, w: number, h: number, semilla: number): void {
  const hm = Math.min(h, Math.round(w * ALTO_DISENO));
  ctx.save();
  DIBUJO[id](ctx, w, hm, mulberry32(semilla));
  ctx.restore();
  if (h > hm) {
    ctx.fillStyle = BASE_PLANTILLA[id];
    ctx.fillRect(0, hm - 1, w, h - hm + 1);
  }
}
