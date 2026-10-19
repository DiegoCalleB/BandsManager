/** Reglas de frescura del directorio: puras y con la fecha de hoy como argumento para poder probarlas. */
import type { Festival } from './tipos.js';

/** Una ficha no verificada en este tiempo deja de mostrarse y de indexarse hasta que alguien la compruebe. */
export const DIAS_VALIDEZ = 365;
/** Con menos fichas completas (con web oficial o convocatoria) que estas, el directorio es una página fina: se publica pero con `noindex`. */
export const MIN_FICHAS_INDEXABLES = 8;

const MS_DIA = 86_400_000;
const aMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

export const diasDesde = (iso: string, hoy: string): number => Math.floor((aMs(hoy) - aMs(iso)) / MS_DIA);

export const estaVigente = (f: Festival, hoy: string): boolean => diasDesde(f.verificadoEn, hoy) <= DIAS_VALIDEZ;

/** Abierta mientras el plazo no haya pasado. Una convocatoria sin plazo conocido no se anuncia como abierta. */
export const convocatoriaAbierta = (f: Festival, hoy: string): boolean => !!f.convocatoria?.cierre && f.convocatoria.cierre >= hoy;

export const festivalesVigentes = (todos: readonly Festival[], hoy: string): Festival[] =>
  todos.filter((f) => estaVigente(f, hoy)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

/** Una ficha mínima (solo lugar y estilo) no aporta nada que no tenga la fuente: no se indexa ni cuenta para el umbral. */
export const esCompleta = (f: Festival): boolean => !!f.web || !!f.convocatoria;

export const indexable = (todos: readonly Festival[], hoy: string): boolean => festivalesVigentes(todos, hoy).filter(esCompleta).length >= MIN_FICHAS_INDEXABLES;

export const fichaIndexable = (f: Festival, todos: readonly Festival[], hoy: string): boolean => esCompleta(f) && indexable(todos, hoy);
