// Piezas comunes del layout del cartel: tipos, el reparto del nombre en líneas, la fecha con jerarquía y la fila
// de logos. Las composiciones (ventana, centrada, base) las combinan de formas distintas. Puro.
//
// Todo se expresa en `u` = ancho / 1080, así el mismo diseño escala de la vista previa al A4.

import { ajustarPiezas } from './texto';
import { VOCES, type Composicion, type DefVoz, type VozCartel } from './voces';

export type { Composicion };
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
  /** Calle y número de la sala, o vacío. */
  direccion?: string;
  /** Línea libre: «Anticipada 10 €». Puede traer varias líneas separadas por \n (las usa el modo con letras de IA). */
  extra: string;
}

export interface OpcionesLayout {
  /** Ajustes a mano de este formato: mover y escalar bloques sobre el reparto automático. */
  ajustes?: import('./ajustesFinos').AjustesFinos;
  /** Letra, color y ocultar de cada bloque (los mismos en todos los formatos). */
  estilos?: import('./ajustesFinos').EstilosBloques;
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
  /** La letra de exhibición (nombre y día de la fecha). */
  voz?: VozCartel;
  /** Cómo se reparte el cartel: ventana (nombre arriba, datos abajo), centrada (simétrica) o base (nombre abajo). */
  composicion?: Composicion;
}


/** `titulo`: `true` = la letra de exhibición del cartel; una voz = esa letra concreta (estilo de bloque). */
export type Medidor = (texto: string, px: number, peso: number, titulo?: boolean | VozCartel, tracking?: number) => number;

export interface Linea {
  texto: string;
  x: number;
  /** Borde superior del texto (textBaseline = 'top'). */
  y: number;
  px: number;
  peso: number;
  alinear: 'left' | 'right' | 'center';
  /** Va en la letra de exhibición de la voz (el nombre y el día), no en Onest. */
  titulo?: boolean;
  /** Espaciado entre letras, en em: las versalitas pequeñas respiran (0 = el de la fuente). */
  tracking?: number;
  /** A qué bloque ajustable pertenece (para moverlo y escalarlo a mano). */
  bloque?: import('./ajustesFinos').BloqueAjustable;
  /** Letra elegida a mano para este bloque (pisa la de la voz del cartel). */
  voz?: VozCartel;
  /** Color elegido a mano para este bloque (pisa la tinta automática). */
  color?: string;
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
  /** La caja que ocupa el nombre (para que la ilustración pueda solaparlo). Null si no hay nombre. */
  titulo: Rect | null;
  /** Filetes y adornos (con o sin rombo), en la tinta del texto. */
  adornos: Adorno[];
  /** Zona superior (nombres) e inferior (datos): ahí se mide el fondo y, si hace falta, se vela. */
  zonas: { arriba: Rect; abajo: Rect };
  /** La caja de cada bloque que se puede mover a mano, en su posición final. */
  cajas?: Partial<Record<import('./ajustesFinos').BloqueAjustable, Rect>>;
}

/** Un filete horizontal; con `rombo`, partido en el centro por un rombo pequeño. */
export interface Adorno {
  x: number;
  y: number;
  w: number;
  grosor: number;
  rombo: boolean;
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


/**
 * Mayor tamaño (entre `max` y `min`) con el que las piezas caben en `ancho` en como mucho
 * `maxLineas`. Un nombre corto crece hasta llenar el ancho: así es un cartel, no un formulario.
 */
export function encajar(piezas: string[], sep: string, ancho: number, maxLineas: number, max: number, min: number, peso: number, medir: Medidor, prefijo = '', titulo = false, tracking = 0) {
  let px = max;
  for (;;) {
    const lineas = ajustarPiezas(piezas, sep, ancho, (t) => medir(t, px, peso, titulo, tracking), prefijo);
    const cabe = lineas.length <= maxLineas && lineas.every((l) => medir(l, px, peso, titulo, tracking) <= ancho);
    if (cabe || px <= min) return { px, lineas: lineas.slice(0, maxLineas) };
    px = Math.max(min, Math.floor(px * 0.92));
  }
}



// ---------------------------------------------------------------------------------------------------------
// Contexto y piezas que comparten las composiciones
// ---------------------------------------------------------------------------------------------------------

export interface CtxLayout {
  def: DefFormato;
  ancho: number;
  alto: number;
  /** Unidad: ancho / 1080. */
  u: number;
  /** Margen. */
  m: number;
  /** Ancho útil (sin márgenes). */
  util: number;
  datos: DatosCartel;
  opciones: OpcionesLayout;
  medir: Medidor;
  voz: DefVoz;
}

export function contexto(def: DefFormato, ancho: number, datos: DatosCartel, opciones: OpcionesLayout, medir: Medidor): CtxLayout {
  const u = ancho / 1080;
  const m = 72 * u;
  return { def, ancho, alto: Math.round(ancho * def.proporcion), u, m, util: ancho - 2 * m, datos, opciones, medir, voz: VOCES[opciones.voz ?? 'moderna'] };
}

/** Nombres de la cabeza de cartel (o de todas si no hay cabeza) y de las invitadas. */
export function repartirLineup(datos: DatosCartel) {
  const cabezas = datos.lineup.filter((b) => b.cabeza && b.nombre.trim());
  const resto = datos.lineup.filter((b) => !b.cabeza && b.nombre.trim());
  const principales = (cabezas.length ? cabezas : resto).map((b) => b.nombre.trim().toUpperCase());
  const secundarias = (cabezas.length ? resto : []).map((b) => b.nombre.trim().toUpperCase());
  return { principales, secundarias };
}

export interface ResNombre {
  lineas: Linea[];
  /** Borde inferior de lo colocado. */
  yFin: number;
  /** Caja del nombre (sin invitadas), o null. */
  titulo: Rect | null;
}

/**
 * El nombre en líneas, de arriba abajo desde `y`, alineado a la izquierda o centrado en `x`, más las bandas
 * invitadas debajo si `conInvitadas`. Con `grande` el nombre es el protagonista: tamaño máximo y una línea ancha
 * si cabe, aunque no haya ilustración (la composición «base»).
 */
export function construirNombre(c: CtxLayout, x: number, y: number, ancho: number, alinear: 'left' | 'center', conInvitadas: boolean, grande = false): ResNombre {
  const { u, voz, medir, opciones } = c;
  const { principales, secundarias } = repartirLineup(c.datos);
  const lineas: Linea[] = [];
  const yIni = y;
  if (principales.length) {
    // Un nombre de una o dos palabras puede ir en dos líneas grandes; uno largo, en tres.
    const maxTitulo = Math.round((opciones.compacto && !grande ? voz.tituloCompacto : voz.titulo) * u);
    const intentar = (k: number) => encajar(principales, ' + ', ancho, k, maxTitulo, Math.round(56 * u), voz.peso, medir, '+ ', true);
    let { px, lineas: ls } = intentar(3);
    // Con una ilustración, el nombre en UNA línea ancha (o dos) si cabe sin quedarse pequeño: es lo que hace un
    // cartel, y deja sitio al dibujo. Un nombre largo sigue partiéndose en tres.
    if (opciones.compacto || grande) {
      for (const k of [1, 2]) {
        const r = intentar(k);
        if (r.lineas.length <= k && r.px >= maxTitulo * 0.5) {
          ({ px, lineas: ls } = r);
          break;
        }
      }
    }
    for (const t of ls) {
      lineas.push({ texto: t, x, y, px, peso: voz.peso, alinear, titulo: true, bloque: 'nombre' });
      y += px * voz.interlinea;
    }
  }
  // Con bandas invitadas debajo del nombre no se solapa nada: sus letras son pequeñas y se leerían mal.
  const titulo: Rect | null = principales.length && !secundarias.length ? { x: c.m, y: yIni, w: c.util, h: y - yIni } : null;
  if (conInvitadas && secundarias.length) {
    y += 20 * u;
    const nombres = [...secundarias];
    nombres[0] = `CON ${nombres[0]}`;
    const { px, lineas: ls } = encajar(nombres, ' · ', ancho, 2, Math.round(50 * u), Math.round(30 * u), 700, medir);
    for (const t of ls) {
      lineas.push({ texto: t, x, y, px, peso: 700, alinear, bloque: 'nombre' });
      y += px * 1.1;
    }
  }
  return { lineas, yFin: y, titulo };
}

export interface FechaCompuesta {
  dia: string;
  num: string;
  lado: string;
  ancNum: number;
  ancLado: number;
  hueco: number;
  numPx: number;
  pxMes: number;
  pxDia: number;
  /** Alto de la caja de las cifras. */
  alto: number;
  /** Ancho total de la pieza. */
  total: number;
}

/**
 * La fecha con jerarquía: el día enorme y, a su lado, el mes y el año y el día de la semana. Null si no se puede
 * partir (formato raro) o no cabe en `anchoDisp`: entonces va en una línea como cualquier otra.
 */
export function fechaCompuesta(c: CtxLayout, anchoDisp: number): FechaCompuesta | null {
  const partes = /^(\S+)\s+(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(c.datos.fecha.trim());
  if (!partes) return null;
  const { u, voz, medir } = c;
  const [, dia, num, mes, anio] = partes;
  const numPx = Math.round(voz.numeral * u);
  const pxMes = Math.round(54 * u);
  const pxDia = Math.round(36 * u);
  const ancNum = medir(num, numPx, voz.peso, true);
  const lado = `${mes} ${anio}`;
  const ancLado = Math.max(medir(lado, pxMes, 800, false, 0.03), medir(dia, pxDia, 600, false, 0.18));
  const hueco = 28 * u;
  if (ancNum + hueco + ancLado > anchoDisp) return null;
  // El cuerpo del día manda: las cifras ocupan ~0,72 del cuerpo, centradas en vertical en su caja.
  return { dia, num, lado, ancNum, ancLado, hueco, numPx, pxMes, pxDia, alto: numPx * 0.86, total: ancNum + hueco + ancLado };
}

/** Las tres líneas de la fecha compuesta, con su caja empezando en `yTop` y la pieza entera desde `x` (izquierda). */
export function colocarFecha(f: FechaCompuesta, voz: DefVoz, x: number, yTop: number): Linea[] {
  const xl = x + f.ancNum + f.hueco;
  return [
    { texto: f.num, x, y: yTop - f.numPx * 0.12, px: f.numPx, peso: voz.peso, alinear: 'left', titulo: true, bloque: 'fecha' },
    { texto: f.lado, x: xl, y: yTop + f.alto * 0.12, px: f.pxMes, peso: 800, alinear: 'left', tracking: 0.03, bloque: 'fecha' },
    { texto: f.dia, x: xl, y: yTop + f.alto * 0.12 + f.pxMes * 1.12, px: f.pxDia, peso: 600, alinear: 'left', tracking: 0.18, bloque: 'fecha' },
  ];
}

export type IdBloque = 'fecha' | 'horario' | 'lugar' | 'direccion' | 'extra';
export interface Bloque {
  id: IdBloque;
  piezas: string[];
  px: number;
  peso: number;
  maxLineas: number;
  min: number;
  espacio: number;
  tracking?: number;
}

export function bloquesDatos(c: CtxLayout): Bloque[] {
  const { u, datos } = c;
  const lugar = [datos.sala, datos.ciudad].map((s) => s.trim().toUpperCase()).filter(Boolean);
  const todos: Bloque[] = [
    { id: 'fecha', piezas: [datos.fecha], px: Math.round(78 * u), peso: 800, maxLineas: 1, min: Math.round(40 * u), espacio: 14 * u },
    { id: 'horario', piezas: datos.horario.split(' · '), px: Math.round(38 * u), peso: 600, maxLineas: 1, min: Math.round(24 * u), espacio: 18 * u, tracking: 0.06 },
    { id: 'lugar', piezas: lugar, px: Math.round(46 * u), peso: 700, maxLineas: 2, min: Math.round(28 * u), espacio: 14 * u, tracking: 0.05 },
    { id: 'direccion', piezas: [(datos.direccion ?? '').trim().toUpperCase()], px: Math.round(30 * u), peso: 600, maxLineas: 2, min: Math.round(20 * u), espacio: 12 * u, tracking: 0.05 },
    { id: 'extra', piezas: [datos.extra.trim().toUpperCase()], px: Math.round(34 * u), peso: 600, maxLineas: 1, min: Math.round(22 * u), espacio: 0, tracking: 0.06 },
  ];
  return todos.filter((b) => b.piezas.some((p) => p.trim()));
}

/**
 * Apila los bloques de datos de abajo arriba desde `fondo`, en `ancho`, a la izquierda desde `x` o centrados en `x`.
 * Devuelve las líneas y el borde superior de lo colocado.
 */
export function apilarDatos(c: CtxLayout, o: { alinear: 'left' | 'center'; x: number; ancho: number; fondo: number; solo?: IdBloque[] }): { lineas: Linea[]; yTop: number } {
  const { voz, medir } = c;
  const bloques = bloquesDatos(c).filter((b) => !o.solo || o.solo.includes(b.id));
  const comp = bloques.some((b) => b.id === 'fecha') ? fechaCompuesta(c, o.ancho) : null;
  const colocadas: Linea[] = [];
  let yb = o.fondo;
  for (const b of [...bloques].reverse()) {
    if (comp && b.id === 'fecha') {
      yb -= b.espacio;
      yb -= comp.alto;
      colocadas.unshift(...colocarFecha(comp, voz, o.alinear === 'center' ? o.x - comp.total / 2 : o.x, yb));
      continue;
    }
    const { px, lineas: ls } = encajar(b.piezas, ' · ', o.ancho, b.maxLineas, b.px, b.min, b.peso, medir, '', false, b.tracking ?? 0);
    yb -= b.espacio;
    for (const t of [...ls].reverse()) {
      yb -= px * 1.08;
      colocadas.unshift({ texto: t, x: o.x, y: yb, px, peso: b.peso, alinear: o.alinear, tracking: b.tracking, bloque: 'datos' });
    }
  }
  return { lineas: colocadas, yTop: yb };
}

/** Pie: la marca a la izquierda y el enlace corto a la derecha, apoyados en `fondo`. Devuelve su línea y el nuevo fondo. */
export function colocarPie(c: CtxLayout, fondo: number): { lineas: Linea[]; fondo: number } {
  const { u, m, ancho, opciones } = c;
  const lineas: Linea[] = [];
  const pie = Math.round(26 * u);
  if (opciones.marca || opciones.urlCorta) {
    const yPie = fondo - pie;
    if (opciones.marca) lineas.push({ texto: TEXTO_MARCA, x: m, y: yPie, px: pie, peso: 600, alinear: 'left', tracking: 0.03, bloque: 'pie' });
    if (opciones.urlCorta) lineas.push({ texto: opciones.urlCorta, x: ancho - m, y: yPie, px: pie, peso: 600, alinear: 'right', tracking: 0.03, bloque: 'pie' });
    fondo = yPie - 28 * u;
  }
  return { lineas, fondo };
}
