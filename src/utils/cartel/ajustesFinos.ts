// Ajuste fino a mano: mover y escalar cada bloque del texto (nombre, fecha, datos, QR, logos, pie) sobre el
// reparto automático. El automático sigue siendo la base y el ajuste es una capa encima: si cambia el formato o los
// datos, el cartel se recompone solo y el ajuste se aplica sobre el nuevo reparto. Puro: recibe el layout ya hecho.

import type { FormatoCartel } from './formatos';
import type { LayoutCartel, Linea, Medidor, Rect } from './layoutBase';
import { VOCES, VOCES_CARTEL, type VozCartel } from './voces';

export const BLOQUES = ['nombre', 'fecha', 'datos', 'qr', 'logos', 'pie'] as const;
export type BloqueAjustable = (typeof BLOQUES)[number];

export const ETIQUETA_BLOQUE: Record<BloqueAjustable, string> = {
  nombre: 'Nombre',
  fecha: 'Fecha',
  datos: 'Datos',
  qr: 'QR',
  logos: 'Logos',
  pie: 'Pie',
};

/** Desplazamiento en fracción del ANCHO del cartel (así vale igual en la vista previa y en el A4) y escala del bloque. */
export interface AjusteBloque {
  dx: number;
  dy: number;
  escala: number;
}
export type AjustesFinos = Partial<Record<BloqueAjustable, AjusteBloque>>;
export type AjustesFinosPorFormato = Partial<Record<FormatoCartel, AjustesFinos>>;

/**
 * Estilo de un bloque, igual en todos los formatos (la posición sí va por formato): su letra, su color y si se oculta.
 * Sin estilo = el automático. La letra solo vale en los bloques de texto; el color también en los logos.
 */
export interface EstiloBloque {
  fuente?: VozCartel;
  color?: string;
  oculto?: boolean;
}
export type EstilosBloques = Partial<Record<BloqueAjustable, EstiloBloque>>;
export const BLOQUES_CON_FUENTE: readonly BloqueAjustable[] = ['nombre', 'fecha', 'datos', 'pie'];
export const BLOQUES_CON_COLOR: readonly BloqueAjustable[] = ['nombre', 'fecha', 'datos', 'pie', 'logos'];
const COLOR_HEX = /^#[0-9a-f]{6}$/i;

export function sanearEstilosBloques(raw: unknown): EstilosBloques {
  const salida: EstilosBloques = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return salida;
  for (const b of BLOQUES) {
    const e = (raw as Record<string, unknown>)[b];
    if (!e || typeof e !== 'object') continue;
    const { fuente, color, oculto } = e as Record<string, unknown>;
    const limpio: EstiloBloque = {};
    if (BLOQUES_CON_FUENTE.includes(b) && VOCES_CARTEL.includes(fuente as VozCartel)) limpio.fuente = fuente as VozCartel;
    if (BLOQUES_CON_COLOR.includes(b) && typeof color === 'string' && COLOR_HEX.test(color)) limpio.color = color.toLowerCase();
    if (oculto === true) limpio.oculto = true;
    if (Object.keys(limpio).length) salida[b] = limpio;
  }
  return salida;
}

/** Con el estilo de un bloque cambiado; un campo en `undefined` lo quita y un estilo vacío desaparece. */
export function conEstiloDeBloque(todos: EstilosBloques, bloque: BloqueAjustable, cambio: Partial<Record<keyof EstiloBloque, EstiloBloque[keyof EstiloBloque] | undefined>>): EstilosBloques {
  const siguiente = sanearEstilosBloques({ ...todos, [bloque]: { ...todos[bloque], ...cambio } });
  return siguiente;
}

export const LIMITES = { desplazamiento: 1.5, escalaMin: 0.5, escalaMax: 2.5 } as const;
const FORMATOS_VALIDOS: readonly FormatoCartel[] = ['feed', 'historia', 'imprimir'];

const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const redondear = (v: number) => Math.round(v * 1000) / 1000;
export const esIdentidad = (a: AjusteBloque) => a.dx === 0 && a.dy === 0 && a.escala === 1;

/** Cualquier cosa → ajustes válidos: bloques y formatos conocidos, números finitos y dentro de rango; la identidad se descarta. */
export function sanearAjustesFinos(raw: unknown): AjustesFinosPorFormato {
  const salida: AjustesFinosPorFormato = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return salida;
  for (const f of FORMATOS_VALIDOS) {
    const delFormato = (raw as Record<string, unknown>)[f];
    if (!delFormato || typeof delFormato !== 'object' || Array.isArray(delFormato)) continue;
    const limpio: AjustesFinos = {};
    for (const b of BLOQUES) {
      const a = (delFormato as Record<string, unknown>)[b];
      if (!a || typeof a !== 'object') continue;
      const { dx, dy, escala } = a as Record<string, unknown>;
      const ajuste: AjusteBloque = {
        dx: redondear(Math.max(-LIMITES.desplazamiento, Math.min(LIMITES.desplazamiento, numero(dx) ?? 0))),
        dy: redondear(Math.max(-LIMITES.desplazamiento, Math.min(LIMITES.desplazamiento, numero(dy) ?? 0))),
        escala: redondear(Math.max(LIMITES.escalaMin, Math.min(LIMITES.escalaMax, numero(escala) ?? 1))),
      };
      if (!esIdentidad(ajuste)) limpio[b] = ajuste;
    }
    if (Object.keys(limpio).length) salida[f] = limpio;
  }
  return salida;
}

/** Con un ajuste cambiado (o quitado si queda en identidad) para un bloque de un formato. */
export function conAjusteDeBloque(todos: AjustesFinosPorFormato, formato: FormatoCartel, bloque: BloqueAjustable, ajuste: AjusteBloque): AjustesFinosPorFormato {
  const delFormato: AjustesFinos = { ...todos[formato] };
  if (esIdentidad(ajuste)) delete delFormato[bloque];
  else delFormato[bloque] = ajuste;
  const salida = { ...todos };
  if (Object.keys(delFormato).length) salida[formato] = delFormato;
  else delete salida[formato];
  return salida;
}

/** Quita los ajustes de un formato: vuelve al reparto automático. */
export function sinAjustesDeFormato(todos: AjustesFinosPorFormato, formato: FormatoCartel): AjustesFinosPorFormato {
  const salida = { ...todos };
  delete salida[formato];
  return salida;
}

const union = (a: Rect | undefined, b: Rect): Rect => {
  if (!a) return b;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

function cajaDeLinea(l: Linea, medir: Medidor): Rect {
  const w = medir(l.texto, l.px, l.peso, l.voz ?? l.titulo, l.tracking);
  const x = l.alinear === 'left' ? l.x : l.alinear === 'right' ? l.x - w : l.x - w / 2;
  return { x, y: l.y, w, h: l.px * 0.95 };
}

/** La caja de cada bloque presente en el layout (para tocarlo y arrastrarlo). */
export function cajasDeBloques(L: LayoutCartel, medir: Medidor): Partial<Record<BloqueAjustable, Rect>> {
  const cajas: Partial<Record<BloqueAjustable, Rect>> = {};
  for (const l of L.lineas) {
    if (!l.bloque) continue;
    cajas[l.bloque] = union(cajas[l.bloque], cajaDeLinea(l, medir));
  }
  if (L.qr) cajas.qr = L.qr;
  for (const r of L.logos) cajas.logos = union(cajas.logos, r);
  return cajas;
}

const mover = (r: Rect, cx: number, cy: number, e: number, dx: number, dy: number): Rect => ({
  x: cx + (r.x - cx) * e + dx,
  y: cy + (r.y - cy) * e + dy,
  w: r.w * e,
  h: r.h * e,
});

/**
 * Aplica los ajustes al layout: cada bloque se escala alrededor de su centro y se desplaza. Después se empuja lo
 * justo para que el bloque entero siga DENTRO del lienzo, y se recalculan las zonas (donde se mide el fondo y se vela)
 * para que sigan cubriendo lo que antes estaba en cada una. Devuelve un layout nuevo con las `cajas` ya a posición final.
 */
export function aplicarAjustesFinos(L: LayoutCartel, ajustes: AjustesFinos | undefined, medir: Medidor, estilos?: EstilosBloques): LayoutCartel {
  const cajas = cajasDeBloques(L, medir);
  const tocado = (b: BloqueAjustable) => (ajustes?.[b] && !esIdentidad(ajustes[b]!)) || (estilos?.[b] && Object.keys(estilos[b]!).length > 0);
  const activos = BLOQUES.filter((b) => cajas[b] && tocado(b));
  if (!activos.length) return { ...L, cajas };

  const enAbajo = (l: Linea) => l.y >= L.zonas.abajo.y;
  const abajoOriginal = new Set(L.lineas.filter(enAbajo));
  const lineas = L.lineas.map((l) => ({ ...l }));
  let qr = L.qr ? { ...L.qr } : null;
  let logos = L.logos.map((r) => ({ ...r }));
  let titulo = L.titulo ? { ...L.titulo } : null;
  const nuevas: Partial<Record<BloqueAjustable, Rect>> = { ...cajas };
  const ocultas = new Set<number>();

  for (const b of activos) {
    const caja = cajas[b]!;
    const estilo = estilos?.[b];
    if (estilo?.oculto) {
      L.lineas.forEach((l, i) => l.bloque === b && ocultas.add(i));
      if (b === 'qr') qr = null;
      if (b === 'logos') logos = [];
      if (b === 'nombre') titulo = null;
      delete nuevas[b];
      continue;
    }
    // Otra letra mide distinto: el bloque se reescala para conservar el ancho que tenía.
    let porLetra = 1;
    if (estilo?.fuente) {
      const propias = L.lineas.filter((l) => l.bloque === b);
      const viejo = Math.max(...propias.map((l) => medir(l.texto, l.px, l.peso, l.titulo, l.tracking)));
      const nuevo = Math.max(...propias.map((l) => medir(l.texto, l.px, VOCES[estilo.fuente!].peso, estilo.fuente, l.tracking)));
      if (nuevo > 0) porLetra = Math.max(0.5, Math.min(1.6, viejo / nuevo));
      lineas.forEach((l, i) => {
        if (L.lineas[i].bloque === b) {
          l.voz = estilo.fuente;
          l.peso = VOCES[estilo.fuente!].peso;
        }
      });
    }
    if (estilo?.color) lineas.forEach((l, i) => L.lineas[i].bloque === b && (l.color = estilo.color));
    // La escala se limita a lo que cabe en el lienzo: un nombre ya a todo el ancho no puede crecer más.
    const pedida = (ajustes?.[b]?.escala ?? 1) * porLetra;
    const e = Math.max(0.05, Math.min(pedida, L.ancho / caja.w, L.alto / caja.h));
    const a = { dx: ajustes?.[b]?.dx ?? 0, dy: ajustes?.[b]?.dy ?? 0, escala: e };
    const cx = caja.x + caja.w / 2;
    const cy = caja.y + caja.h / 2;
    let dx = a.dx * L.ancho;
    let dy = a.dy * L.ancho;
    // Que el bloque escalado y desplazado no se salga del lienzo.
    const prueba = mover(caja, cx, cy, a.escala, dx, dy);
    dx += Math.max(0, -prueba.x) - Math.max(0, prueba.x + prueba.w - L.ancho);
    dy += Math.max(0, -prueba.y) - Math.max(0, prueba.y + prueba.h - L.alto);
    nuevas[b] = mover(caja, cx, cy, a.escala, dx, dy);
    lineas.forEach((l, i) => {
      if (L.lineas[i].bloque !== b) return;
      l.x = cx + (l.x - cx) * a.escala + dx;
      l.y = cy + (l.y - cy) * a.escala + dy;
      l.px = l.px * a.escala;
    });
    if (b === 'qr' && qr) qr = mover(qr, cx, cy, a.escala, dx, dy);
    if (b === 'logos') logos = logos.map((r) => mover(r, cx, cy, a.escala, dx, dy));
    if (b === 'nombre' && titulo) titulo = mover(titulo, cx, cy, a.escala, dx, dy);
  }

  // Con otra letra la caja es la del texto ya pintado en ella (no la de la letra anterior, escalada).
  for (const b of activos) {
    if (estilos?.[b]?.oculto || !estilos?.[b]?.fuente) continue;
    const propias = lineas.filter((l, i) => L.lineas[i].bloque === b);
    if (propias.length) nuevas[b] = propias.map((l) => cajaDeLinea(l, medir)).reduce<Rect | undefined>((acc, r) => union(acc, r), undefined);
  }

  // Las zonas siguen cubriendo lo que estaba en cada una (arriba o abajo), allí donde haya quedado.
  let arribaH = L.zonas.arriba.h;
  let abajoY = L.zonas.abajo.y;
  lineas.forEach((l, i) => {
    if (ocultas.has(i)) return;
    if (abajoOriginal.has(L.lineas[i])) abajoY = Math.min(abajoY, l.y - l.px * 0.2);
    else arribaH = Math.max(arribaH, l.y + l.px * 1.1);
  });
  if (qr && L.qr && L.qr.y >= L.zonas.abajo.y) abajoY = Math.min(abajoY, qr.y);
  logos.forEach((r) => (abajoY = Math.min(abajoY, r.y - r.h * 0.2)));
  abajoY = Math.max(abajoY, 0);

  return {
    ...L,
    lineas: lineas.filter((_, i) => !ocultas.has(i)),
    qr,
    logos,
    titulo,
    zonas: { arriba: { ...L.zonas.arriba, h: Math.min(L.alto, arribaH) }, abajo: { x: 0, y: abajoY, w: L.ancho, h: L.alto - abajoY } },
    cajas: nuevas,
  };
}
