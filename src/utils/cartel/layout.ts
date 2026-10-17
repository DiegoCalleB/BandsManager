// Dónde va cada cosa en el cartel. Puro: recibe un medidor de texto (en el navegador,
// `ctx.measureText`; en los tests, uno falso) y devuelve líneas, QR, marca y las zonas
// donde hay texto (para medir el contraste del fondo justo ahí).
//
// Todo se expresa en `u` = ancho / 1080, así el mismo diseño escala de la vista previa al A4.

import { ajustarPiezas } from './texto';
import type { DefFormato } from './formatos';

export interface BandaCartel {
  nombre: string;
  /** Cabeza de cartel. Si ninguna lo es, todas van al mismo tamaño. */
  cabeza: boolean;
}

export interface DatosCartel {
  lineup: BandaCartel[];
  /** Ya formateada: «SÁB 14 NOV 2026». */
  fecha: string;
  /** «PUERTAS 20:30 · SHOW 21:30» o vacío. */
  horario: string;
  sala: string;
  ciudad: string;
  /** Línea libre: «Anticipada 10 €». */
  extra: string;
}

export interface OpcionesLayout {
  /** Reserva hueco para el QR (solo impresión). */
  qr: boolean;
  /** Texto de la URL corta, sin protocolo: `bandmanager.io/r/ab3k9x2`. */
  urlCorta: string | null;
  marca: boolean;
  /**
   * Fila de logos de las bandas, encima de los datos: la proporción ancho/alto de cada uno, en orden.
   * Layout puro: no sabe de imágenes, solo reserva a cada logo un hueco con esa proporción.
   */
  logos?: number[];
  /**
   * Con una ilustración de IA entre el nombre y los datos, el nombre se hace menos grande para dejarle
   * sitio: un nombre de dos palabras a tamaño máximo se comía casi la mitad del cartel.
   */
  compacto?: boolean;
}

export type Medidor = (texto: string, px: number, peso: number) => number;

export interface Linea {
  texto: string;
  x: number;
  /** Borde superior del texto (textBaseline = 'top'). */
  y: number;
  px: number;
  peso: number;
  alinear: 'left' | 'right';
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutCartel {
  ancho: number;
  alto: number;
  lineas: Linea[];
  qr: Rect | null;
  /** Un hueco por logo, en orden y centrados en vertical sobre la misma línea (vacío si no hay logos). */
  logos: Rect[];
  /** Zona superior (nombres) e inferior (datos): ahí se mide el fondo y, si hace falta, se vela. */
  zonas: { arriba: Rect; abajo: Rect };
}

export const TEXTO_MARCA = 'Hecho con BandManager.io';

/** Como mucho tantos logos en la fila (el de la banda y los subidos para el bolo). */
export const MAX_LOGOS_FILA = 5;

/**
 * Huecos de una fila de logos con el mismo «peso» óptico: un logo cuadrado y un nombre larguísimo no miden
 * lo mismo en alto, pero sí ocupan una superficie parecida. Se centran en vertical y, si no caben en
 * `util`, se reducen todos por igual (también los huecos).
 */
export function filaDeLogos(aspectos: number[], x0: number, yTecho: number, util: number, u: number): { rects: Rect[]; alto: number } {
  const validos = aspectos.filter((a) => Number.isFinite(a) && a > 0).slice(0, MAX_LOGOS_FILA);
  if (!validos.length) return { rects: [], alto: 0 };
  const base = 92 * u;
  const dims = validos.map((a) => {
    // Superficie constante (w·h = base²) y topes: ni una tira ni una torre.
    let h = base / Math.sqrt(a);
    let w = h * a;
    if (w > base * 2.4) { w = base * 2.4; h = w / a; }
    if (h > base * 1.1) { h = base * 1.1; w = h * a; }
    return { w, h };
  });
  const hueco = 44 * u;
  const total = dims.reduce((s, d) => s + d.w, 0) + hueco * (dims.length - 1);
  const k = total > util ? util / total : 1;
  const alto = Math.max(...dims.map((d) => d.h)) * k;
  let x = x0;
  const rects = dims.map((d) => {
    const r = { x, y: yTecho + (alto - d.h * k) / 2, w: d.w * k, h: d.h * k };
    x += d.w * k + hueco * k;
    return r;
  });
  return { rects, alto };
}

const INTERLINEA = 0.94;

/**
 * Mayor tamaño (entre `max` y `min`) con el que las piezas caben en `ancho` en como mucho
 * `maxLineas`. Un nombre corto crece hasta llenar el ancho: así es un cartel, no un formulario.
 */
function encajar(piezas: string[], sep: string, ancho: number, maxLineas: number, max: number, min: number, peso: number, medir: Medidor, prefijo = '') {
  let px = max;
  for (;;) {
    const lineas = ajustarPiezas(piezas, sep, ancho, (t) => medir(t, px, peso), prefijo);
    const cabe = lineas.length <= maxLineas && lineas.every((l) => medir(l, px, peso) <= ancho);
    if (cabe || px <= min) return { px, lineas: lineas.slice(0, maxLineas) };
    px = Math.max(min, Math.floor(px * 0.92));
  }
}

export function calcularLayout(
  def: DefFormato,
  ancho: number,
  datos: DatosCartel,
  opciones: OpcionesLayout,
  medir: Medidor
): LayoutCartel {
  const alto = Math.round(ancho * def.proporcion);
  const u = ancho / 1080;
  const m = 72 * u;
  const util = ancho - 2 * m;
  const lineas: Linea[] = [];

  // ---------- arriba: el lineup ----------
  const cabezas = datos.lineup.filter((b) => b.cabeza && b.nombre.trim());
  const resto = datos.lineup.filter((b) => !b.cabeza && b.nombre.trim());
  const principales = cabezas.length ? cabezas : resto;
  const secundarias = cabezas.length ? resto : [];

  let y = m + def.seguroArriba * alto;
  const titular = principales.map((b) => b.nombre.trim().toUpperCase());
  if (titular.length) {
    // Un nombre de una o dos palabras puede ir en dos líneas grandes; uno largo, en tres.
    const { px, lineas: ls } = encajar(titular, ' + ', util, 3, Math.round((opciones.compacto ? 150 : 210) * u), Math.round(56 * u), 800, medir, '+ ');
    for (const t of ls) {
      lineas.push({ texto: t, x: m, y, px, peso: 800, alinear: 'left' });
      y += px * INTERLINEA;
    }
  }
  if (secundarias.length) {
    y += 20 * u;
    const nombres = secundarias.map((b) => b.nombre.trim().toUpperCase());
    nombres[0] = `CON ${nombres[0]}`;
    const { px, lineas: ls } = encajar(nombres, ' · ', util, 2, Math.round(50 * u), Math.round(30 * u), 700, medir);
    for (const t of ls) {
      lineas.push({ texto: t, x: m, y, px, peso: 700, alinear: 'left' });
      y += px * 1.1;
    }
  }
  const arriba: Rect = { x: 0, y: 0, w: ancho, h: Math.min(alto, y + m * 0.6) };

  // ---------- abajo: pie (marca / URL corta), datos y QR, de abajo arriba ----------
  let fondo = alto - m - def.seguroAbajo * alto;
  const pie = Math.round(26 * u);
  if (opciones.marca || opciones.urlCorta) {
    const yPie = fondo - pie;
    if (opciones.marca) lineas.push({ texto: TEXTO_MARCA, x: m, y: yPie, px: pie, peso: 600, alinear: 'left' });
    if (opciones.urlCorta) lineas.push({ texto: opciones.urlCorta, x: ancho - m, y: yPie, px: pie, peso: 600, alinear: 'right' });
    fondo = yPie - 28 * u;
  }

  const ladoQr = opciones.qr ? Math.round(230 * u) : 0;
  const anchoDatos = opciones.qr ? util - ladoQr - 40 * u : util;

  // Se apilan hacia arriba desde `fondo`.
  type Bloque = { piezas: string[]; px: number; peso: number; maxLineas: number; min: number; espacio: number };
  const lugar = [datos.sala, datos.ciudad].map((s) => s.trim().toUpperCase()).filter(Boolean);
  const bloques: Bloque[] = [
    { piezas: [datos.fecha], px: Math.round(78 * u), peso: 800, maxLineas: 1, min: Math.round(40 * u), espacio: 14 * u },
    { piezas: datos.horario.split(' · '), px: Math.round(38 * u), peso: 600, maxLineas: 1, min: Math.round(24 * u), espacio: 18 * u },
    { piezas: lugar, px: Math.round(46 * u), peso: 700, maxLineas: 2, min: Math.round(28 * u), espacio: 14 * u },
    { piezas: [datos.extra.trim().toUpperCase()], px: Math.round(34 * u), peso: 600, maxLineas: 1, min: Math.round(22 * u), espacio: 0 },
  ].filter((b) => b.piezas.some((p) => p.trim()));

  const colocadas: Linea[] = [];
  let yb = fondo;
  for (const b of [...bloques].reverse()) {
    const { px, lineas: ls } = encajar(b.piezas, ' · ', anchoDatos, b.maxLineas, b.px, b.min, b.peso, medir);
    yb -= b.espacio;
    for (const t of [...ls].reverse()) {
      yb -= px * 1.08;
      colocadas.unshift({ texto: t, x: m, y: yb, px, peso: b.peso, alinear: 'left' });
    }
  }
  lineas.push(...colocadas);

  const qr: Rect | null = opciones.qr ? { x: ancho - m - ladoQr, y: fondo - ladoQr, w: ladoQr, h: ladoQr } : null;

  // La fila de logos va justo encima de lo más alto de los datos (o del QR, si sobresale).
  let techo = Math.min(yb, qr ? qr.y : yb);
  const fila = filaDeLogos(opciones.logos ?? [], m, 0, util, u);
  let logos: Rect[] = [];
  if (fila.rects.length) {
    const yFila = techo - 34 * u - fila.alto;
    logos = fila.rects.map((r) => ({ ...r, y: r.y + yFila }));
    techo = yFila;
  }

  const techoAbajo = techo - m * 0.6;
  const abajo: Rect = { x: 0, y: Math.max(0, techoAbajo), w: ancho, h: alto - Math.max(0, techoAbajo) };

  return { ancho, alto, lineas, qr, logos, zonas: { arriba, abajo } };
}
