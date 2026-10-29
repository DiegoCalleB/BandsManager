/**
 * El bucle de aprendizaje del asesor: qué piezas esperan sus números, qué cuenta como un número
 * válido y qué se ha aprendido de lo medido. Lógica pura, compartida entre cliente y servidor.
 *
 * Los umbrales y la lectura (valor frente a descubrimiento) vienen de `diagnosticoMetricas.ts`, que
 * sale de la lección de métricas clave: guardados en torno al 3 % del alcance y al menos un 30 %
 * del alcance fuera de los seguidores. Aquí solo se ordenan los resultados y se dice qué formato
 * le funciona a la banda; no se inventa nada que no se haya medido.
 */
import { diasEntre, fechaCorta } from '../campanaConcierto';
import { ALCANCE_MINIMO, diagnosticarPieza, type Veredicto } from './diagnosticoMetricas';
import type { AccionRegistrada } from './opciones';
import type { Formato } from './reglasFormato';

/** Los números de Instagram se miran a las 48 h (lección de métricas clave). */
export const DIAS_PARA_MEDIR = 2;
/** Pasado este tiempo ya no se pregunta: los números dejan de decir nada de la pieza. */
export const DIAS_MAXIMOS_PARA_MEDIR = 14;
export const MAX_POR_MEDIR = 3;
/** Ventana del resumen y del aprendizaje, en días. */
export const DIAS_RESUMEN = 14;
export const DIAS_IMPULSO = 28;
export const MIN_PIEZAS_RESUMEN = 2;
const MAX_METRICA = 1_000_000_000;
const MAX_EN_LISTA = 3;

export interface ResultadoPieza {
  /** AAAA-MM-DD en que se marcó como hecha. */
  fecha: string;
  tarjetaId: string;
  formato: Formato;
  titulo: string;
  alcance: number;
  guardados: number;
  alcanceNoSeguidores: number | null;
}

export interface PorMedir {
  fecha: string;
  tarjetaId: string;
  formato: Formato;
  titulo: string;
}

export const ETIQUETA_FORMATO: Record<Formato, string> = { reel: 'Reel', carrusel: 'Carrusel', stories: 'Stories', post: 'Post' };
export const PLURAL_FORMATO: Record<Formato, string> = { reel: 'los reels', carrusel: 'los carruseles', stories: 'las stories', post: 'los posts' };

/** El título de la idea; si la acción es anterior a guardarlo, «Reel del martes 28 de octubre». */
export function tituloDe(a: Pick<AccionRegistrada, 'titulo' | 'formato' | 'fecha'>): string {
  return a.titulo?.trim() || `${ETIQUETA_FORMATO[a.formato]} del ${fechaCorta(a.fecha)}`;
}

/** Piezas marcadas como hechas hace al menos 2 días y todavía sin sus números, las más recientes primero. */
export function porMedir(acciones: AccionRegistrada[], resultados: Array<Pick<ResultadoPieza, 'fecha' | 'tarjetaId'>>, hoy: string): PorMedir[] {
  return acciones
    .filter((a) => {
      const dias = diasEntre(a.fecha, hoy);
      return a.accion === 'hecho' && dias >= DIAS_PARA_MEDIR && dias <= DIAS_MAXIMOS_PARA_MEDIR
        && !resultados.some((r) => r.fecha === a.fecha && r.tarjetaId === a.tarjetaId);
    })
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, MAX_POR_MEDIR)
    .map((a) => ({ fecha: a.fecha, tarjetaId: a.tarjetaId, formato: a.formato, titulo: tituloDe(a) }));
}

/* ----------------------------------------------------------------- lo que se anota */

export interface Medidas {
  alcance: number;
  guardados: number;
  alcanceNoSeguidores: number | null;
}

const entero = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= MAX_METRICA ? n : null;
};

/**
 * Lo que la banda escribe, validado. Devuelve las medidas o el motivo, en una frase que se puede
 * enseñar tal cual. Vacío o ausente en «de no seguidores» es válido: es opcional.
 */
export function sanearMedidas(raw: { alcance?: unknown; guardados?: unknown; alcanceNoSeguidores?: unknown }): Medidas | string {
  const alcance = entero(raw.alcance);
  if (alcance === null || alcance < 1) return 'Escribe cuántas cuentas ha alcanzado la pieza (un número entero, mayor que 0).';
  const guardados = entero(raw.guardados);
  if (guardados === null) return 'Escribe cuántas personas la han guardado (un número entero, puede ser 0).';
  if (guardados > alcance) return 'No pueden haberla guardado más personas de las que la han visto.';
  const vacio = raw.alcanceNoSeguidores === undefined || raw.alcanceNoSeguidores === null || raw.alcanceNoSeguidores === '';
  const noSeguidores = vacio ? null : entero(raw.alcanceNoSeguidores);
  if (!vacio && noSeguidores === null) return 'Las cuentas que no os seguían tienen que ser un número entero.';
  if (noSeguidores !== null && noSeguidores > alcance) return 'No puede haber más cuentas que no os seguían que cuentas alcanzadas.';
  return { alcance, guardados, alcanceNoSeguidores: noSeguidores };
}

/** La lectura de una pieza, en el mismo vocabulario que el resto de la pantalla. */
export const lecturaDe = (m: Medidas) => diagnosticarPieza({ alcance: m.alcance, guardados: m.guardados, alcanceNoSeguidores: m.alcanceNoSeguidores ?? undefined });

/* ----------------------------------------------------------------- lo que se aprende */

export interface ItemResumen extends ResultadoPieza {
  tasaGuardar: number;
  veredicto: Veredicto;
  mensaje: string;
}

export interface Resumen {
  piezas: number;
  /** Las que más han guardado y las que menos, con su lectura (lección: «los tres mejores y peores»). */
  mejores: ItemResumen[];
  peores: ItemResumen[];
  /** El formato con mejor tasa media de guardados, solo si hay con qué comparar. */
  formatoGanador: { formato: Formato; tasa: number; piezas: number } | null;
  mensaje: string;
}

const pct = (t: number) => `${(t * 100).toFixed(1).replace('.', ',')} %`;

function enVentana(r: Pick<ResultadoPieza, 'fecha'>, hoy: string, dias: number): boolean {
  const d = diasEntre(r.fecha, hoy);
  return d >= 0 && d <= dias;
}

/** Null si aún no hay al menos dos piezas con alcance suficiente para sacar conclusiones. */
export function resumenDe(resultados: ResultadoPieza[], hoy: string): Resumen | null {
  const items: ItemResumen[] = resultados
    .filter((r) => enVentana(r, hoy, DIAS_RESUMEN) && r.alcance >= ALCANCE_MINIMO)
    .map((r) => {
      const lectura = lecturaDe(r);
      return { ...r, tasaGuardar: r.guardados / r.alcance, veredicto: lectura.veredicto, mensaje: lectura.mensaje };
    })
    .sort((a, b) => b.tasaGuardar - a.tasaGuardar);
  if (items.length < MIN_PIEZAS_RESUMEN) return null;

  const mejores = items.slice(0, Math.min(MAX_EN_LISTA, Math.ceil(items.length / 2)));
  const peores = items.slice(items.length - Math.min(MAX_EN_LISTA, Math.floor(items.length / 2))).reverse();

  const porFormato = new Map<Formato, number[]>();
  for (const i of items) porFormato.set(i.formato, [...(porFormato.get(i.formato) ?? []), i.tasaGuardar]);
  // Un «ganador» necesita con qué compararse: al menos dos formatos medidos y, el ganador, dos piezas.
  const candidatos = [...porFormato.entries()]
    .filter(([, t]) => t.length >= 2)
    .map(([formato, t]) => ({ formato, tasa: t.reduce((a, b) => a + b, 0) / t.length, piezas: t.length }))
    .sort((a, b) => b.tasa - a.tasa);
  const formatoGanador = porFormato.size >= 2 && candidatos.length ? candidatos[0] : null;

  const mensaje = formatoGanador
    ? `${PLURAL_FORMATO[formatoGanador.formato]} son lo que más os guardan: ${pct(formatoGanador.tasa)} de quienes los ven.`.replace(/^./, (c) => c.toUpperCase())
    : `Lo que mejor ha ido: «${mejores[0].titulo}», guardada por el ${pct(mejores[0].tasaGuardar)} de quienes la vieron.`;
  return { piezas: items.length, mejores, peores, formatoGanador, mensaje };
}

/**
 * Lo que han dado los formatos en el último mes, para ordenar las ideas de hoy: +1 por cada pieza
 * que funcionó, −1 por cada una que ni llegó ni se guardó, entre −2 y +2. Lo demás (valor o
 * descubrimiento) no mueve nada: ahí no está claro que el formato tenga la culpa.
 */
export function impulsoPorFormato(resultados: ResultadoPieza[], hoy: string): Partial<Record<Formato, number>> {
  const neto: Partial<Record<Formato, number>> = {};
  for (const r of resultados) {
    if (!enVentana(r, hoy, DIAS_IMPULSO)) continue;
    const v = lecturaDe(r).veredicto;
    if (v === 'funciona') neto[r.formato] = (neto[r.formato] ?? 0) + 1;
    else if (v === 'falla_todo') neto[r.formato] = (neto[r.formato] ?? 0) - 1;
  }
  const impulso: Partial<Record<Formato, number>> = {};
  for (const [f, n] of Object.entries(neto) as Array<[Formato, number]>) impulso[f] = Math.max(-2, Math.min(2, n));
  return impulso;
}
