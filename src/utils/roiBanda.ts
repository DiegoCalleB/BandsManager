/**
 * «Lo que ha cobrado tu banda frente a lo que cuesta tu plan». Lógica pura, sin I/O.
 *
 * Es deliberadamente CONSERVADOR: solo cuenta dinero cobrado (nada de previsiones ni pendientes)
 * y evita contar dos veces el mismo bolo (el caché sale de los conciertos pagados; de los pagos
 * registrados solo entran los ingresos que NO son de concierto: merchandising, subvenciones...).
 * Y no pretende demostrar causalidad: dice lo que se ha cobrado, no que BandManager lo haya
 * generado. Si no hay datos o el plan es gratuito, no se inventa ningún múltiplo.
 */
import type { Concert, Payment } from '../types';
import { PLANS, normalizePlan } from './planPermissions';

export const MESES_VENTANA = 3;

/** Precio mensual en € de un plan, leído de `PLANS` (la única fuente de precios). 0 si es gratuito. */
export function precioMensualPlan(plan?: string): number {
  const def = PLANS[normalizePlan(plan)];
  const m = def?.price.match(/^(\d+(?:[.,]\d+)?)\s*€\s*\/\s*mes/i);
  return m ? Number(m[1].replace(',', '.')) : 0;
}

/** Los últimos `n` meses naturales hasta el de `hoy` incluido, del más antiguo al actual: ['2026-08','2026-09','2026-10']. */
export function mesesVentana(hoy: string, n: number = MESES_VENTANA): string[] {
  const [a, m] = hoy.slice(0, 7).split('-').map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const total = a * 12 + (m - 1) - i;
    out.push(`${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`);
  }
  return out;
}

export interface EntradaRoi {
  concerts: Array<Pick<Concert, 'fecha' | 'cache' | 'estado_pago' | 'aforo_vendido' | 'tipo'>>;
  payments: Array<Pick<Payment, 'tipo' | 'categoria' | 'importe' | 'fecha' | 'estado'>>;
  plan?: string;
  /** AAAA-MM-DD de hoy. */
  hoy: string;
  /** Clics a entradas desde los enlaces cortos en la misma ventana (si se conocen). */
  clicsEntradas?: number;
}

export interface ResultadoRoi {
  meses: string[];
  /** Cobrado por mes natural (para la Onda), mismo orden que `meses`. */
  porMes: number[];
  ingresosBolos: number;
  otrosIngresos: number;
  ingresos: number;
  bolosCobrados: number;
  entradasVendidas: number;
  precioMensual: number;
  costePlan: number;
  /** Veces que lo cobrado cubre el coste del plan. null si el plan es gratuito o no se ha cobrado nada. */
  multiplo: number | null;
  clicsEntradas: number;
  estado: 'sin_datos' | 'con_datos';
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const dia = (f: unknown) => (typeof f === 'string' ? f.slice(0, 10) : '');

export function calcularRoi(e: EntradaRoi): ResultadoRoi {
  const meses = mesesVentana(e.hoy);
  const desde = `${meses[0]}-01`;
  const enVentana = (fecha: string) => fecha >= desde && fecha <= e.hoy;
  const indice = new Map(meses.map((m, i) => [m, i]));
  const porMes: number[] = meses.map(() => 0);

  let ingresosBolos = 0;
  let bolosCobrados = 0;
  let entradasVendidas = 0;
  for (const c of e.concerts) {
    const f = dia(c.fecha);
    if (!enVentana(f)) continue;
    entradasVendidas += Math.max(0, num(c.aforo_vendido));
    if (c.estado_pago === 'pagado' && num(c.cache) > 0) {
      ingresosBolos += num(c.cache);
      bolosCobrados++;
      porMes[indice.get(f.slice(0, 7))!] += num(c.cache);
    }
  }

  let otrosIngresos = 0;
  for (const p of e.payments) {
    const f = dia(p.fecha);
    // Los de concierto se cuentan por el propio concierto (arriba): sumarlos aquí duplicaría el bolo.
    if (p.tipo !== 'ingreso' || p.estado !== 'pagado' || p.categoria === 'concierto' || !enVentana(f)) continue;
    const imp = Math.max(0, num(p.importe));
    otrosIngresos += imp;
    porMes[indice.get(f.slice(0, 7))!] += imp;
  }

  const ingresos = ingresosBolos + otrosIngresos;
  const precioMensual = precioMensualPlan(e.plan);
  const costePlan = precioMensual * MESES_VENTANA;
  const multiplo = costePlan > 0 && ingresos > 0 ? Math.round((ingresos / costePlan) * 10) / 10 : null;

  return {
    meses,
    porMes: porMes.map((v) => Math.round(v * 100) / 100),
    ingresosBolos,
    otrosIngresos,
    ingresos,
    bolosCobrados,
    entradasVendidas,
    precioMensual,
    costePlan,
    multiplo,
    clicsEntradas: Math.max(0, num(e.clicsEntradas)),
    estado: ingresos > 0 || entradasVendidas > 0 || num(e.clicsEntradas) > 0 ? 'con_datos' : 'sin_datos',
  };
}

/** Clics que han llegado a una pasarela de entradas (solo los enlaces con destino «entradas»). */
export function clicsDeEntradas(enlaces: Array<{ destino: string; clics?: number }>): number {
  return enlaces.filter((e) => e.destino === 'entradas').reduce((n, e) => n + Math.max(0, num(e.clics)), 0);
}
