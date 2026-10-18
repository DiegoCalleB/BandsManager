/**
 * Ilustraciones SVG de las guías, generadas en el servidor: sin imágenes que cargar ni derechos que gestionar.
 * Siguen el lenguaje de la marca (la Onda: barras verticales de puntas redondeadas) y los colores salen de los
 * tokens vía `style`, no de hexadecimales.
 */
import { escapeHtml } from '../html.js';
import type { IdiomaSeo } from './rutas.js';

/** Hash estable (no criptográfico) para que cada guía tenga su propia Onda, siempre la misma. */
function semilla(texto: string): number {
  let h = 2166136261;
  for (const c of texto) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Banda decorativa de cabecera: una Onda distinta por guía. */
export function ondaHeroSvg(slug: string): string {
  const barras = 44;
  const ancho = 8;
  const hueco = 6;
  const alto = 120;
  let x = semilla(slug);
  const rects: string[] = [];
  for (let i = 0; i < barras; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const azar = ((x >>> 8) % 1000) / 1000;
    const envolvente = 0.3 + 0.55 * Math.sin((i / (barras - 1)) * Math.PI);
    const h = Math.round(16 + (envolvente * 0.65 + azar * 0.35) * 90);
    const pico = h > 84;
    rects.push(`<rect x="${i * (ancho + hueco)}" y="${(alto - h) / 2}" width="${ancho}" height="${h}" rx="${ancho / 2}" style="fill:var(--acc);opacity:${pico ? 1 : 0.32}"/>`);
  }
  const total = barras * (ancho + hueco) - hueco;
  return `<svg class="hero" viewBox="0 0 ${total} ${alto}" role="presentation" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">${rects.join('')}</svg>`;
}

const ENERGIA_SETLIST = [62, 70, 74, 82, 88, 48, 42, 70, 86, 90, 96, 92];
// [primer tema, último tema] de cada tramo sobre los 12 temas del ejemplo.
const TRAMOS: Array<[number, number]> = [[0, 1], [2, 4], [5, 6], [7, 9], [10, 11]];

const TEXTOS_CURVA: Record<IdiomaSeo, { tramos: string[]; mejor: string; alt: string; pie: string }> = {
  es: {
    tramos: ['Gancho', 'Subida', 'Respiro', 'Remontada', 'Cierre'],
    mejor: 'El más conocido',
    alt: 'Gráfico de barras con la energía de un setlist de doce temas: sube en los primeros cinco, cae en el sexto y el séptimo, remonta hasta el penúltimo, que es el más conocido, y cierra alto.',
    pie: 'Ejemplo de curva de energía de un set de doce temas. Cada barra es un tema; la altura, su energía.',
  },
  en: {
    tramos: ['Hook', 'Lift', 'Breather', 'Climb', 'Closer'],
    mejor: 'Best known',
    alt: 'Bar chart of the energy of a twelve-song setlist: it rises over the first five songs, dips on the sixth and seventh, climbs again to the second-to-last, which is the best known, and closes high.',
    pie: 'Example energy curve for a twelve-song set. Each bar is a song; its height is its energy.',
  },
};

/** Infografía de la curva de energía de un setlist en cinco tramos. */
export function curvaSetlistFigura(idioma: IdiomaSeo): string {
  const t = TEXTOS_CURVA[idioma];
  const ancho = 36;
  const hueco = 10;
  const margen = 24;
  const base = 160;
  const barras = ENERGIA_SETLIST.map((e, i) => {
    const h = Math.round((e / 100) * 140);
    const pico = i === 10;
    const respiro = i === 5 || i === 6;
    const opacidad = pico ? 1 : respiro ? 0.3 : 0.6;
    const x = margen + i * (ancho + hueco);
    return `<rect x="${x}" y="${base - h}" width="${ancho}" height="${h}" rx="${ancho / 2}" style="fill:var(--acc);opacity:${opacidad}"/><text x="${x + ancho / 2}" y="${base + 22}" text-anchor="middle" font-size="17" style="fill:var(--ink-2)">${i + 1}</text>`;
  });
  const etiquetas = TRAMOS.map(([a, b], i) => {
    const x1 = margen + a * (ancho + hueco);
    const x2 = margen + b * (ancho + hueco) + ancho;
    return `<line x1="${x1}" y1="200" x2="${x2}" y2="200" stroke-width="3" stroke-linecap="round" style="stroke:var(--ink-3, var(--ink-2));opacity:.5"/><text x="${(x1 + x2) / 2}" y="226" text-anchor="middle" font-size="18" font-weight="600" style="fill:var(--ink)">${escapeHtml(t.tramos[i])}</text>`;
  });
  const hMejor = Math.round((ENERGIA_SETLIST[10] / 100) * 140);
  const xMejor = margen + 10 * (ancho + hueco) + ancho / 2;
  const aviso = `<text x="${xMejor}" y="${base - hMejor - 10}" text-anchor="middle" font-size="18" font-weight="600" style="fill:var(--acc-ink)">${escapeHtml(t.mejor)}</text>`;
  const total = margen * 2 + 12 * ancho + 11 * hueco;
  return `<figure class="fig"><svg viewBox="0 0 ${total} 240" role="img" aria-label="${escapeHtml(t.alt)}"><title>${escapeHtml(t.alt)}</title>${barras.join('')}${aviso}${etiquetas.join('')}</svg><figcaption>${escapeHtml(t.pie)}</figcaption></figure>`;
}
