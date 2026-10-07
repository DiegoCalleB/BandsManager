import { simplificarGrado, type Funcion } from './teoriaArmonica';

/** Cómo se muestran los acordes en el visor: como nombre, como grado romano o ambos; con o sin color por función. */
export interface EstiloArmonia {
  mostrar: 'nombre' | 'grado' | 'ambos';
  colorear: 'funcion' | 'nada';
  /** «simple» escribe el número del grado sin b ni # (III, VII); «completo» lo escribe con ellas (bIII, bVII, #IV). */
  grados: 'simple' | 'completo';
}

export const ESTILO_POR_DEFECTO: EstiloArmonia = { mostrar: 'nombre', colorear: 'funcion', grados: 'simple' };
const CLAVE = 'bm_estilo_armonia';

export function leerEstiloArmonia(): EstiloArmonia {
  try {
    const crudo = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAVE) : null;
    if (!crudo) return ESTILO_POR_DEFECTO;
    const v = JSON.parse(crudo);
    return {
      mostrar: ['nombre', 'grado', 'ambos'].includes(v?.mostrar) ? v.mostrar : ESTILO_POR_DEFECTO.mostrar,
      colorear: ['funcion', 'nada'].includes(v?.colorear) ? v.colorear : ESTILO_POR_DEFECTO.colorear,
      grados: ['simple', 'completo'].includes(v?.grados) ? v.grados : ESTILO_POR_DEFECTO.grados,
    };
  } catch {
    return ESTILO_POR_DEFECTO;
  }
}

export function guardarEstiloArmonia(e: EstiloArmonia): void {
  try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch { /* sin almacenamiento: vale solo esta sesión */ }
}

/**
 * Clases (solo tokens del sistema de diseño) de un acorde según su función. El color nunca va solo:
 * cada función lleva además una letra (T/S/D/M) en la leyenda y en el título del chip.
 */
export const CLASE_FUNCION: Record<Funcion, string> = {
  T: 'bg-[var(--ok-soft)] text-[var(--ok)]',
  S: 'bg-[var(--acc-soft)] text-[var(--acc-ink)]',
  D: 'bg-[var(--tentative-soft)] text-[var(--tentative)]',
  M: 'bg-[var(--sunken)] text-[var(--ink)]',
  X: 'bg-[var(--sunken)] text-[var(--ink-2)] italic',
};

export const LETRA_FUNCION: Record<Funcion, string> = { T: 'T', S: 'S', D: 'D', M: 'M', X: '?' };

/** Texto de un acorde según el estilo: «Am», «vi» o «Am vi» (el grado va aparte para pintarlo pequeño). */
export function textoDeAcorde(nombre: string, grado: string | null | undefined, mostrar: EstiloArmonia['mostrar']): { principal: string; secundario?: string } {
  if (!grado || mostrar === 'nombre') return { principal: nombre };
  if (mostrar === 'grado') return { principal: grado };
  return { principal: nombre, secundario: grado };
}

/**
 * Grado tal como se muestra. En modo «simple» se quitan la b y el # (bIII → III, bVII → VII): es el número
 * del grado, sin más. La mayúscula/minúscula y el ° siguen distinguiendo el acorde (III ≠ iii).
 */
export function gradoVisible(grado: string, estilo?: Pick<EstiloArmonia, 'grados'>): string {
  if ((estilo?.grados ?? ESTILO_POR_DEFECTO.grados) !== 'simple') return grado;
  return simplificarGrado(grado);
}
