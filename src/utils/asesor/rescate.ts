/**
 * Modo rescate: detectar cuándo lo que publica la banda deja de funcionar y qué probar en su
 * lugar. Lógica pura y determinista, sobre los resultados que la banda ya anotó: sin números
 * no se rescata nada (mejor no decir nada que inventar una caída).
 *
 * Dos señales, las dos explicables en una frase:
 *  - tres semanas seguidas con menos alcance medio, y la última claramente por debajo de la primera;
 *  - las tres últimas piezas medidas sin arrancar (ni llegan lejos ni se guardan).
 */
import { diasEntre } from '../campanaConcierto';
import type { Rescate } from './diagnostico';
import { ALCANCE_MINIMO } from './diagnosticoMetricas';
import type { Formato } from './reglasFormato';
import { lecturaDe, type ResultadoPieza } from './resumen';

export const SEMANAS_CAIDA = 3;
/** La última semana tiene que estar por debajo de este porcentaje de la primera: lo demás es ruido. */
export const CAIDA_MINIMA = 0.7;
export const DIAS_MEJOR = 28;
const PIEZAS_SEGUIDAS = 3;

/** Lo opuesto de lo que no funciona: del descubrimiento al valor y al revés. */
export const FORMATO_OPUESTO: Record<Formato, Formato> = { reel: 'carrusel', carrusel: 'reel', stories: 'reel', post: 'carrusel' };

const media = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;

/** El formato más repetido; en un empate, el de la pieza más reciente. `piezas` va de más reciente a más antigua. */
function formatoMasUsado(piezas: ResultadoPieza[]): Formato | null {
  const cuenta = new Map<Formato, number>();
  for (const p of piezas) cuenta.set(p.formato, (cuenta.get(p.formato) ?? 0) + 1);
  let mejor: Formato | null = null;
  for (const p of piezas) if (mejor === null || (cuenta.get(p.formato) ?? 0) > (cuenta.get(mejor) ?? 0)) mejor = p.formato;
  return mejor;
}

/** Alcance medio de las últimas tres semanas, de la más antigua a la más reciente; null si falta alguna. */
function alcancePorSemana(piezas: ResultadoPieza[], hoy: string): number[] | null {
  const semanas: number[][] = Array.from({ length: SEMANAS_CAIDA }, () => []);
  for (const p of piezas) {
    const dias = diasEntre(p.fecha, hoy);
    if (dias >= 0 && dias < SEMANAS_CAIDA * 7 && p.alcance >= ALCANCE_MINIMO) semanas[Math.floor(dias / 7)].push(p.alcance);
  }
  if (semanas.some((s) => s.length === 0)) return null;
  return semanas.map(media).reverse();
}

function mejorReciente(piezas: ResultadoPieza[], hoy: string): Rescate['mejor'] {
  const candidatas = piezas
    .filter((p) => diasEntre(p.fecha, hoy) <= DIAS_MEJOR && p.alcance >= ALCANCE_MINIMO && p.guardados > 0)
    .sort((a, b) => b.guardados / b.alcance - a.guardados / a.alcance);
  const m = candidatas[0];
  return m ? { titulo: m.titulo, formato: m.formato, tasa: m.guardados / m.alcance } : null;
}

/** Null si lo que publican no está en caída (o si todavía no hay con qué saberlo). */
export function detectarCaida(resultados: ResultadoPieza[], hoy: string): Rescate | null {
  const recientes = resultados
    .filter((r) => diasEntre(r.fecha, hoy) >= 0 && diasEntre(r.fecha, hoy) < SEMANAS_CAIDA * 7)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

  const semanas = alcancePorSemana(recientes, hoy);
  if (semanas && semanas[0] > semanas[1] && semanas[1] > semanas[2] && semanas[2] <= semanas[0] * CAIDA_MINIMA) {
    return { motivo: 'tres_semanas', formatoFlojo: formatoMasUsado(recientes), mejor: mejorReciente(resultados, hoy) };
  }

  const ultimas = recientes.slice(0, PIEZAS_SEGUIDAS);
  if (ultimas.length === PIEZAS_SEGUIDAS && ultimas.every((p) => lecturaDe(p).veredicto === 'falla_todo')) {
    return { motivo: 'tres_seguidas', formatoFlojo: formatoMasUsado(ultimas), mejor: mejorReciente(resultados, hoy) };
  }
  return null;
}
