/**
 * Diagnóstico de una pieza publicada a partir de sus métricas, con los umbrales de la lección de
 * métricas clave de Instagram. Lógica pura: el asesor lo usa en la ficha de la pieza y en el
 * resumen semanal. Las tasas de cada reel ya las calcula `server/utils/aprendizajeReels.ts`;
 * esto añade la lectura: QUÉ falla y qué tocar.
 *
 * La idea central del temario: alcance sin guardados es un problema de VALOR (el gancho atrae pero
 * el contenido no aporta); guardados sin alcance fuera es un problema de DESCUBRIMIENTO (gusta a
 * los tuyos pero el gancho no sale de casa).
 */

/** Umbrales de salud (lección de métricas clave de IG). */
export const UMBRALES = {
  /** Guardados / alcance. */
  guardar: 0.03,
  /** Alcance de no seguidores / alcance total. */
  noSeguidores: 0.3,
  /** Clics en el enlace a la semana / seguidores: horquilla sana. */
  clicsSemana: [0.005, 0.02] as const,
};

/** Con menos alcance que esto, cualquier porcentaje es ruido. */
export const ALCANCE_MINIMO = 100;

export interface MetricasPieza {
  alcance: number;
  guardados: number;
  /** Alcance que vino de cuentas que no te siguen (Insights lo da). Opcional. */
  alcanceNoSeguidores?: number;
}

export type Veredicto = 'funciona' | 'falla_valor' | 'falla_descubrimiento' | 'falla_todo' | 'sin_datos';

export interface Diagnostico {
  veredicto: Veredicto;
  /** Una línea para la banda, sin jerga. */
  mensaje: string;
}

const MENSAJES: Record<Veredicto, string> = {
  funciona: 'Funciona: llega a gente nueva y la guardan. Repite esta estructura.',
  falla_valor: 'Llega lejos pero casi nadie la guarda: el gancho atrae y el contenido no aporta. Dale más chicha o historia.',
  falla_descubrimiento: 'A los tuyos les encanta, pero no sale de casa: prueba un gancho más fuerte en los 3 primeros segundos.',
  falla_todo: 'Ni llega ni se guarda: cambia de tema o de formato, no la repitas.',
  sin_datos: 'Todavía hay poco alcance para sacar conclusiones.',
};

export function diagnosticarPieza(m: MetricasPieza): Diagnostico {
  if (!(m.alcance >= ALCANCE_MINIMO)) return { veredicto: 'sin_datos', mensaje: MENSAJES.sin_datos };
  const guardaBien = m.guardados / m.alcance >= UMBRALES.guardar;
  // Sin el dato de no seguidores no se puede hablar de descubrimiento: se juzga solo el valor.
  const sale = m.alcanceNoSeguidores === undefined ? true : m.alcanceNoSeguidores / m.alcance >= UMBRALES.noSeguidores;
  const veredicto: Veredicto = guardaBien
    ? sale ? 'funciona' : 'falla_descubrimiento'
    : sale ? 'falla_valor' : 'falla_todo';
  return { veredicto, mensaje: MENSAJES[veredicto] };
}

/** Clics semanales en el enlace de la bio (entradas, presave) frente a la horquilla sana. */
export function estadoClicsEnlace(clicsSemana: number, seguidores: number): 'bajo' | 'sano' | 'alto' | 'sin_datos' {
  if (!(seguidores > 0) || clicsSemana < 0) return 'sin_datos';
  const tasa = clicsSemana / seguidores;
  const [min, max] = UMBRALES.clicsSemana;
  return tasa < min ? 'bajo' : tasa > max ? 'alto' : 'sano';
}

/** Crecimiento neto (altas menos bajas) relativo: lo que importa, no el total acumulado. */
export function crecimientoNeto(seguidoresAntes: number, altas: number, bajas: number): number | null {
  return seguidoresAntes > 0 ? (altas - bajas) / seguidoresAntes : null;
}
