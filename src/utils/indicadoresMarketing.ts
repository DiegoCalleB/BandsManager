/**
 * Los cuatro números del embudo de una banda: a cuánta gente llega, cuántos fans apunta, cuántas
 * salas contestan y cuántas dicen que sí. Todo se calcula con datos que la app ya tiene cargados
 * (fans y leads); los clics de los enlaces cortos llegan aparte, de /api/short-links.
 *
 * Honesto por diseño: solo cuenta hechos con fecha, y compara una ventana con la anterior de la
 * misma longitud. Sin estimaciones ni «potencial».
 */
import type { Fan, Lead } from '../types';

export const DIAS_VENTANA = 30;
const DIA_MS = 86_400_000;

export interface ParActual {
  actual: number;
  /** Mismo recuento en la ventana anterior, para comparar. */
  anterior: number;
}

export interface IndicadoresMarketing {
  fans: ParActual;
  enviados: ParActual;
  respondieron: ParActual;
  dijeronSi: ParActual;
  /** Todo a cero en las dos ventanas: la banda aún no ha movido nada. */
  vacio: boolean;
}

function ms(fecha: string | undefined): number | null {
  if (!fecha) return null;
  const t = new Date(fecha).getTime();
  return Number.isFinite(t) ? t : null;
}

function contar(fechas: Array<string | undefined>, hoy: number): ParActual {
  let actual = 0;
  let anterior = 0;
  const ventana = DIAS_VENTANA * DIA_MS;
  for (const f of fechas) {
    const t = ms(f);
    if (t === null || t > hoy) continue;
    const edad = hoy - t;
    if (edad < ventana) actual++;
    else if (edad < 2 * ventana) anterior++;
  }
  return { actual, anterior };
}

export function calcularIndicadores(entrada: { fans: Fan[]; leads: Lead[]; hoy?: Date }): IndicadoresMarketing {
  const hoy = (entrada.hoy ?? new Date()).getTime();
  const fans = contar(entrada.fans.map((f) => f.fechaCaptura), hoy);
  const enviados = contar(entrada.leads.map((l) => l.fecha_envio), hoy);
  const respondieron = contar(entrada.leads.map((l) => l.fecha_ultima_respuesta), hoy);
  const dijeronSi = contar(
    entrada.leads.filter((l) => l.estado === 'confirmado').map((l) => l.fecha_ultima_respuesta),
    hoy,
  );
  const todos = [fans, enviados, respondieron, dijeronSi];
  return { fans, enviados, respondieron, dijeronSi, vacio: todos.every((p) => p.actual === 0 && p.anterior === 0) };
}

/** Compara con la ventana anterior en texto llano. Sin flechas ni colores de «sube/baja». */
export function textoVariacion(p: ParActual): string {
  const dif = p.actual - p.anterior;
  if (p.actual === 0 && p.anterior === 0) return 'sin movimiento';
  if (dif === 0) return 'igual que los 30 días anteriores';
  if (p.anterior === 0) return 'antes no había ninguno';
  return dif > 0 ? `${dif} más que los 30 días anteriores` : `${-dif} menos que los 30 días anteriores`;
}
