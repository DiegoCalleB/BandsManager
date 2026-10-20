/**
 * Ilustraciones SVG de las guías, generadas en el servidor: sin imágenes que cargar ni derechos que gestionar.
 * Son gráficos de líneas de energía. Los colores salen de los tokens vía `style`, sin hexadecimales, y los
 * rellenos son planos (sin degradados ni halos).
 */
import { escapeHtml } from '../html.js';
import type { IdiomaSeo } from './rutas.js';
import type { GraficoLineas } from './tipos.js';

interface Punto {
  x: number;
  y: number;
}

/** Curva suave que pasa por todos los puntos (Catmull-Rom a Bézier) sin pasarse por encima de los vecinos. */
function curvaSuave(pts: Punto[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const bajo = Math.min(p1.y, p2.y);
    const alto = Math.max(p1.y, p2.y);
    const c1y = Math.min(alto, Math.max(bajo, p1.y + (p2.y - p0.y) / 6));
    const c2y = Math.min(alto, Math.max(bajo, p2.y - (p3.y - p1.y) / 6));
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Hash estable (no criptográfico) para que cada guía tenga su propia curva, siempre la misma. */
function semilla(texto: string): number {
  let h = 2166136261;
  for (const c of texto) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cabecera decorativa: una curva de energía distinta por guía sobre una línea de referencia plana. */
export function heroEnergiaSvg(slug: string): string {
  const ancho = 600;
  const alto = 150;
  const n = 14;
  let x = semilla(slug);
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const azar = ((x >>> 8) % 1000) / 1000;
    const arco = 0.45 + 0.3 * Math.sin((i / (n - 1)) * Math.PI * 1.6 + 0.4);
    ys.push(Math.max(0.12, Math.min(0.95, arco * 0.7 + azar * 0.45)));
  }
  const pts = ys.map((v, i) => ({ x: 20 + (i * (ancho - 40)) / (n - 1), y: 130 - v * 105 }));
  const linea = curvaSuave(pts);
  const area = `${linea}L${pts[n - 1].x} 140L${pts[0].x} 140Z`;
  const rejilla = [45, 85, 125].map((y) => `<line x1="20" y1="${y}" x2="${ancho - 20}" y2="${y}" style="stroke:var(--ink-2);opacity:.12" stroke-width="1"/>`).join('');
  const referencia = `<line x1="20" y1="${(85).toFixed(0)}" x2="${ancho - 20}" y2="85" stroke-dasharray="6 7" stroke-width="2" style="stroke:var(--ink-2);opacity:.35"/>`;
  const maximo = Math.max(...ys);
  const puntos = pts
    .map((p, i) => (ys[i] === maximo ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" style="fill:var(--acc)"/>` : i % 2 === 0 ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" style="fill:var(--surface);stroke:var(--acc);stroke-width:2"/>` : ''))
    .join('');
  return `<svg class="hero" viewBox="0 0 ${ancho} ${alto}" role="presentation" aria-hidden="true" focusable="false">${rejilla}${referencia}<path d="${area}" style="fill:var(--acc);opacity:.12"/><path d="${linea}" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--acc)"/>${puntos}</svg>`;
}

const ENERGIA_SETLIST = [62, 70, 74, 82, 88, 48, 42, 70, 86, 90, 96, 92];
const PLANA = [66, 64, 68, 65, 67, 66, 64, 68, 66, 65, 67, 66];
// [primer tema, último tema] de cada tramo sobre los 12 temas del ejemplo.
const TRAMOS: Array<[number, number]> = [[0, 1], [2, 4], [5, 6], [7, 9], [10, 11]];

const TEXTOS_CURVA: Record<IdiomaSeo, { tramos: string[]; mejor: string; ejeY: string; ejeX: string; niveles: [string, string, string]; con: string; sin: string; alt: string; pie: string }> = {
  es: {
    tramos: ['Gancho', 'Subida', 'Respiro', 'Remontada', 'Cierre'],
    mejor: 'El más conocido',
    ejeY: 'Energía',
    ejeX: 'Orden de los temas',
    niveles: ['Alta', 'Media', 'Baja'],
    con: 'Set con curva',
    sin: 'Playlist sin forma',
    alt: 'Gráfico de líneas con la energía de un setlist de doce temas. La curva sube en los cinco primeros, cae en el sexto y el séptimo, remonta hasta el penúltimo, que es el más conocido, y cierra alto. Una línea discontinua casi plana muestra una playlist sin forma, para comparar.',
    pie: 'Curva de energía de un set de doce temas (línea continua) frente a una playlist sin forma (línea discontinua). Cada punto es un tema.',
  },
  en: {
    tramos: ['Hook', 'Lift', 'Breather', 'Climb', 'Closer'],
    mejor: 'Best known',
    ejeY: 'Energy',
    ejeX: 'Song order',
    niveles: ['High', 'Mid', 'Low'],
    con: 'Shaped set',
    sin: 'Shapeless playlist',
    alt: 'Line chart of the energy of a twelve-song setlist. The curve rises over the first five songs, dips on the sixth and seventh, climbs again to the second-to-last, which is the best known, and closes high. A nearly flat dashed line shows a shapeless playlist for comparison.',
    pie: 'Energy curve of a twelve-song set (solid line) against a shapeless playlist (dashed line). Each dot is a song.',
  },
};

/** Gráfico de líneas de la curva de energía de un setlist en cinco tramos. */
export function curvaSetlistFigura(idioma: IdiomaSeo): string {
  const t = TEXTOS_CURVA[idioma];
  const [x0, x1, yArriba, yAbajo] = [64, 592, 40, 232];
  const ancho = (x1 - x0) / ENERGIA_SETLIST.length;
  const px = (i: number) => x0 + (i + 0.5) * ancho;
  // Deja un hueco bajo los títulos de tramo para que la curva no los pise.
  const py = (e: number) => yAbajo - (e / 100) * (yAbajo - (yArriba + 24));

  const bandas = TRAMOS.map(([a, b], i) => {
    const bx = x0 + a * ancho;
    const bw = (b - a + 1) * ancho;
    const fondo = i % 2 === 0 ? `<rect x="${bx.toFixed(1)}" y="${yArriba - 22}" width="${bw.toFixed(1)}" height="${yAbajo - yArriba + 22}" style="fill:var(--sunken);opacity:.55"/>` : '';
    return `${fondo}<text x="${(bx + bw / 2).toFixed(1)}" y="${yArriba - 6}" text-anchor="middle" font-size="17" font-weight="650" style="fill:var(--ink)">${escapeHtml(t.tramos[i])}</text>`;
  }).join('');

  const rejilla = [100, 50, 0].map((v, k) => `<line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke-width="1" style="stroke:var(--ink-2);opacity:.18"/>${k < 3 ? `<text x="${x0 - 8}" y="${(py(v) + 6).toFixed(1)}" text-anchor="end" font-size="15" style="fill:var(--ink-2)">${escapeHtml(t.niveles[k])}</text>` : ''}`).join('');

  const ptsMain = ENERGIA_SETLIST.map((e, i) => ({ x: px(i), y: py(e) }));
  const ptsPlana = PLANA.map((e, i) => ({ x: px(i), y: py(e) }));
  const linea = curvaSuave(ptsMain);
  const area = `${linea}L${ptsMain[ptsMain.length - 1].x.toFixed(1)} ${yAbajo}L${ptsMain[0].x.toFixed(1)} ${yAbajo}Z`;
  const plana = `<path d="${curvaSuave(ptsPlana)}" fill="none" stroke-width="3" stroke-dasharray="7 8" stroke-linecap="round" style="stroke:var(--ink-2);opacity:.6"/>`;

  const puntos = ptsMain.map((p, i) => (i === 10 ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="8" style="fill:var(--acc)"/>` : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" stroke-width="3" style="fill:var(--surface);stroke:var(--acc)"/>`)).join('');
  const numeros = ptsMain.map((p, i) => `<text x="${p.x.toFixed(1)}" y="${yAbajo + 22}" text-anchor="middle" font-size="16" style="fill:var(--ink-2)">${i + 1}</text>`).join('');
  const mejor = `<text x="${(ptsMain[10].x - 10).toFixed(1)}" y="${(ptsMain[10].y + 36).toFixed(1)}" text-anchor="middle" font-size="17" font-weight="650" style="fill:var(--acc-ink)">${escapeHtml(t.mejor)}</text>`;
  const ejeX = `<text x="${((x0 + x1) / 2).toFixed(0)}" y="${yAbajo + 46}" text-anchor="middle" font-size="16" style="fill:var(--ink-2)">${escapeHtml(t.ejeX)}</text>`;
  const leyenda = `<line x1="${x0}" y1="302" x2="${x0 + 34}" y2="302" stroke-width="4" stroke-linecap="round" style="stroke:var(--acc)"/><text x="${x0 + 42}" y="308" font-size="16" style="fill:var(--ink)">${escapeHtml(t.con)}</text><line x1="${x0 + 220}" y1="302" x2="${x0 + 254}" y2="302" stroke-width="3" stroke-dasharray="7 8" stroke-linecap="round" style="stroke:var(--ink-2);opacity:.7"/><text x="${x0 + 262}" y="308" font-size="16" style="fill:var(--ink)">${escapeHtml(t.sin)}</text>`;

  return `<figure class="fig"><svg viewBox="0 0 600 322" role="img" aria-label="${escapeHtml(t.alt)}"><title>${escapeHtml(t.alt)}</title>${bandas}${rejilla}<path d="${area}" style="fill:var(--acc);opacity:.12"/>${plana}<path d="${linea}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--acc)"/>${puntos}${mejor}${numeros}${ejeX}${leyenda}</svg><figcaption>${escapeHtml(t.pie)}</figcaption></figure>`;
}

const ESTILO_SERIE = {
  principal: { color: 'var(--acc)', ancho: 4.5, guiones: '', area: true },
  secundaria: { color: 'var(--ok)', ancho: 4, guiones: '', area: false },
  neutra: { color: 'var(--ink)', ancho: 3.5, guiones: '', area: false },
  referencia: { color: 'var(--ink-2)', ancho: 3, guiones: '7 8', area: false },
} as const;

/** Redondea hacia un máximo «bonito» para los rótulos del eje (0, 1/4, 1/2, 3/4, 1). */
function formatoNumero(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

/** Gráfico de líneas definido con datos: ejes con rótulos, etiquetas directas al final de cada línea y una nota opcional. */
export function graficoLineasFigura(g: GraficoLineas): string {
  const [x0, x1, yArriba, yAbajo] = [78, 500, 26, 250];
  const n = g.ejeX.etiquetas.length;
  const px = (i: number) => x0 + (n <= 1 ? 0 : (i * (x1 - x0)) / (n - 1));
  const py = (v: number) => yAbajo - (Math.max(0, v) / g.ejeY.max) * (yAbajo - yArriba);
  const unidad = g.ejeY.unidad ? `\u00a0${escapeHtml(g.ejeY.unidad)}` : '';

  const rejilla = [0, 1, 2, 3, 4]
    .map((k) => {
      const v = (g.ejeY.max * k) / 4;
      return `<line x1="${x0}" y1="${py(v).toFixed(1)}" x2="${x1}" y2="${py(v).toFixed(1)}" stroke-width="1" style="stroke:var(--ink-2);opacity:${k === 0 ? 0.35 : 0.16}"/><text x="${x0 - 10}" y="${(py(v) + 6).toFixed(1)}" text-anchor="end" font-size="16" style="fill:var(--ink-2)">${formatoNumero(v)}${unidad}</text>`;
    })
    .join('');

  const cada = Math.ceil(n / 7);
  const etiquetasX = g.ejeX.etiquetas
    .map((e, i) => (i % cada === 0 || i === n - 1 ? `<text x="${px(i).toFixed(1)}" y="${yAbajo + 24}" text-anchor="middle" font-size="16" style="fill:var(--ink-2)">${escapeHtml(e)}</text>` : ''))
    .join('');
  const tituloX = `<text x="${((x0 + x1) / 2).toFixed(0)}" y="${yAbajo + 52}" text-anchor="middle" font-size="16" style="fill:var(--ink-2)">${escapeHtml(g.ejeX.titulo)}</text>`;
  const tituloY = `<text x="${x0}" y="${yArriba - 8}" font-size="16" font-weight="650" style="fill:var(--ink)">${escapeHtml(g.ejeY.titulo)}</text>`;

  const dibujos: string[] = [];
  const etiquetas: Array<{ y: number; texto: string; color: string }> = [];
  g.series.forEach((serie) => {
    const e = ESTILO_SERIE[serie.tipo ?? 'principal'];
    const pts = serie.valores.map((v, i) => ({ x: px(i), y: py(v) }));
    const linea = curvaSuave(pts);
    if (e.area) dibujos.push(`<path d="${linea}L${pts[pts.length - 1].x.toFixed(1)} ${yAbajo}L${pts[0].x.toFixed(1)} ${yAbajo}Z" style="fill:${e.color};opacity:.1"/>`);
    dibujos.push(`<path d="${linea}" fill="none" stroke-width="${e.ancho}" stroke-linecap="round" stroke-linejoin="round"${e.guiones ? ` stroke-dasharray="${e.guiones}"` : ''} style="stroke:${e.color}${serie.tipo === 'referencia' ? ';opacity:.7' : ''}"/>`);
    if (serie.tipo !== 'referencia') dibujos.push(...pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" stroke-width="2.5" style="fill:var(--surface);stroke:${e.color}"/>`));
    if (serie.tipo === 'referencia') {
      // La línea de referencia se rotula a su izquierda, encima de ella, para no confundirla con las series vecinas.
      dibujos.push(`<text x="${x0 + 10}" y="${(pts[0].y - 10).toFixed(1)}" font-size="16" font-weight="650" style="fill:var(--ink-2)">${escapeHtml(serie.nombre)}</text>`);
    } else {
      etiquetas.push({ y: pts[pts.length - 1].y, texto: serie.nombre, color: e.color === 'var(--acc)' ? 'var(--acc-ink)' : e.color });
    }
  });

  // Etiquetas directas al final de cada línea, separadas para que no se pisen.
  etiquetas.sort((a, b) => a.y - b.y);
  for (let i = 1; i < etiquetas.length; i++) etiquetas[i].y = Math.max(etiquetas[i].y, etiquetas[i - 1].y + 22);
  const directas = etiquetas.map((e) => `<text x="${x1 + 12}" y="${(e.y + 6).toFixed(1)}" font-size="16" font-weight="650" style="fill:${e.color}">${escapeHtml(e.texto)}</text>`).join('');

  let nota = '';
  if (g.nota) {
    const serie = g.series[g.nota.serie];
    const x = px(g.nota.indice);
    const y = py(serie.valores[g.nota.indice]);
    // La etiqueta va al lado del punto que deja libre más espacio (las líneas suben hacia la derecha).
    const derecha = x < (x0 + x1) / 2;
    nota = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" style="fill:var(--acc)"/><text x="${(derecha ? x + 16 : x - 16).toFixed(1)}" y="${(y - 12).toFixed(1)}" text-anchor="${derecha ? 'start' : 'end'}" font-size="16" font-weight="650" style="fill:var(--acc-ink)">${escapeHtml(g.nota.texto)}</text>`;
  }

  return `<figure class="fig"><svg viewBox="0 0 640 ${yAbajo + 64}" role="img" aria-label="${escapeHtml(g.alt)}"><title>${escapeHtml(g.alt)}</title>${rejilla}${tituloY}${dibujos.join('')}${nota}${directas}${etiquetasX}${tituloX}</svg><figcaption>${escapeHtml(g.pie)}</figcaption></figure>`;
}

const TEXTOS_EPK: Record<IdiomaSeo, { bloques: string[]; alt: string; pie: string }> = {
  es: {
    bloques: ['Nombre y estilo', 'Escucha inmediata', 'Foto de banda', 'Un dato real', 'Bio de cuatro líneas', 'Vídeo de directo', 'Rider y contacto'],
    alt: 'Esquema de un dossier de banda visto en un móvil, de arriba abajo con siete bloques numerados: nombre y estilo, un reproductor de escucha inmediata, una foto de banda, un dato real de tracción, una biografía de cuatro líneas, un vídeo de directo y, al final, los botones de rider y contacto.',
    pie: 'Orden de un EPK de una sola pantalla: lo que decide el programador va arriba y lo que consulta después, abajo.',
  },
  en: {
    bloques: ['Name and style', 'Instant listen', 'Band photo', 'One real proof point', 'Four-line bio', 'Live video', 'Rider and contact'],
    alt: 'Diagram of a band press kit on a phone, top to bottom with seven numbered blocks: name and style, an instant-listen player, a band photo, one real proof point, a four-line bio, a live video and, at the bottom, the rider and contact buttons.',
    pie: 'Order of a one-screen press kit: what the booker decides on goes at the top and what they check afterwards at the bottom.',
  },
};

/** Esquema de un EPK de una pantalla: un móvil con siete bloques numerados y su explicación a la derecha. */
export function anatomiaEpkFigura(idioma: IdiomaSeo): string {
  const t = TEXTOS_EPK[idioma];
  const x0 = 56;
  const w = 178;
  // [centro vertical del bloque, dibujo]
  const bloques: Array<[number, string]> = [
    [56, `<rect x="${x0}" y="42" width="120" height="14" rx="7" style="fill:var(--ink);opacity:.85"/><rect x="${x0}" y="64" width="86" height="8" rx="4" style="fill:var(--ink-2);opacity:.5"/>`],
    [109, `<rect x="${x0}" y="92" width="${w}" height="34" rx="17" style="fill:var(--acc)"/><path d="M${x0 + 18} 102l12 7-12 7z" style="fill:var(--on-acc)"/><path d="M${x0 + 46} 109c8-12 14 12 22 0s14 12 22 0 14 12 22 0 14 12 22 0" fill="none" stroke-width="3" stroke-linecap="round" style="stroke:var(--on-acc);opacity:.85"/>`],
    [180, `<rect x="${x0}" y="138" width="${w}" height="84" rx="14" style="fill:var(--sunken)"/><circle cx="${x0 + 50}" cy="176" r="12" style="fill:var(--ink-2);opacity:.35"/><circle cx="${x0 + 89}" cy="170" r="14" style="fill:var(--ink-2);opacity:.45"/><circle cx="${x0 + 128}" cy="176" r="12" style="fill:var(--ink-2);opacity:.35"/><rect x="${x0 + 36}" y="192" width="106" height="20" rx="10" style="fill:var(--ink-2);opacity:.3"/>`],
    [247, `<rect x="${x0}" y="234" width="146" height="26" rx="13" style="fill:var(--acc);opacity:.16"/><rect x="${x0 + 14}" y="244" width="96" height="7" rx="3.5" style="fill:var(--acc-ink)"/>`],
    [295, [274, 288, 302, 316].map((y, i) => `<rect x="${x0}" y="${y}" width="${[178, 168, 176, 118][i]}" height="7" rx="3.5" style="fill:var(--ink-2);opacity:.38"/>`).join('')],
    [358, `<rect x="${x0}" y="330" width="${w}" height="56" rx="12" style="fill:var(--sunken)"/><circle cx="${x0 + w / 2}" cy="358" r="15" style="fill:var(--surface)"/><path d="M${x0 + w / 2 - 4} 351l11 7-11 7z" style="fill:var(--acc)"/>`],
    [402, `<rect x="${x0}" y="392" width="86" height="22" rx="11" style="fill:var(--acc)"/><rect x="${x0 + 92}" y="392" width="86" height="22" rx="11" style="fill:var(--sunken)"/>`],
  ];
  const marco = `<rect x="40" y="12" width="210" height="418" rx="32" style="fill:var(--sunken)"/><rect x="48" y="22" width="194" height="398" rx="24" style="fill:var(--surface)"/>`;
  const dibujos = bloques.map(([, d]) => d).join('');
  const etiquetas = bloques
    .map(([cy], i) => `<line x1="${x0 + w + 8}" y1="${cy}" x2="288" y2="${cy}" stroke-width="2" stroke-dasharray="4 5" style="stroke:var(--ink-2);opacity:.4"/><circle cx="304" cy="${cy}" r="14" style="fill:var(--acc)"/><text x="304" y="${cy + 6}" text-anchor="middle" font-size="17" font-weight="700" style="fill:var(--on-acc)">${i + 1}</text><text x="328" y="${cy + 6}" font-size="18" font-weight="600" style="fill:var(--ink)">${escapeHtml(t.bloques[i])}</text>`)
    .join('');
  return `<figure class="fig"><svg viewBox="0 0 600 442" role="img" aria-label="${escapeHtml(t.alt)}"><title>${escapeHtml(t.alt)}</title>${marco}${dibujos}${etiquetas}</svg><figcaption>${escapeHtml(t.pie)}</figcaption></figure>`;
}
