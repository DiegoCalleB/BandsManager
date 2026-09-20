/**
 * Temas del sistema «Espectro» — capa de tokens CSS.
 * Autoridad de diseño: skills/visual-identity/SKILL.md
 *
 * OJO, no confundir con `src/utils/theme.ts`: ese es el sistema VIVO y en
 * producción (`THEMES` → prop `colors` en ~50 componentes, seleccionable
 * desde UserProfileModal). Este fichero no lo toca ni lo sustituye.
 *
 * Aquí se gestiona el atributo `data-theme` del <html>, que alimenta las
 * variables de `src/styles/tokens.css`. Los dos conviven a propósito durante
 * la migración: Espectro entra pantalla a pantalla, no de golpe.
 *
 * La clave es separar PREFERENCIA de TEMA RESUELTO:
 * - preferencia: lo que el usuario eligió, y se guarda ('system' incluido)
 * - resuelto: lo que realmente se pinta ('light' | 'dark' | 'classic')
 *
 * Con 'system' el resuelto cambia en caliente al cambiar el ajuste del
 * dispositivo: sin recargar y sin parpadeo.
 */

export type TemaResuelto = 'light' | 'dark' | 'classic';
export type PreferenciaTema = TemaResuelto | 'system';

export const PREFERENCIAS: ReadonlyArray<{ id: PreferenciaTema; etiqueta: string; descripcion: string }> = [
 { id: 'system', etiqueta: 'Automático', descripcion: 'Sigue el ajuste de tu dispositivo' },
 { id: 'light', etiqueta: 'Claro', descripcion: 'Para trabajar de día' },
 { id: 'dark', etiqueta: 'Oscuro', descripcion: 'Para la furgo y el camerino' },
 { id: 'classic', etiqueta: 'Clásico', descripcion: 'El diseño de siempre' },
];

/** Clave de caché en localStorage. La preferencia definitiva vivirá en el
 * perfil de usuario (Supabase); esto solo evita el fogonazo del primer
 * pintado, que ocurre antes de que arranque React. */
export const CLAVE_TEMA = 'bm-tema';

/**
 * Por defecto, `light`: activa Espectro ahora que la migración está completa.
 * Los usuarios que prefieran el diseño clásico pueden elegir 'Clásico' en
 * configuración y seguirá disponible (no se elimina nunca).
 */
export const TEMA_POR_DEFECTO: PreferenciaTema = 'light';

const VALIDAS: ReadonlySet<string> = new Set(['light', 'dark', 'classic', 'system']);

export function esPreferenciaValida(valor: unknown): valor is PreferenciaTema {
 return typeof valor === 'string' && VALIDAS.has(valor);
}

function consultaOscuro(): MediaQueryList | null {
 if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
 return window.matchMedia('(prefers-color-scheme: dark)');
}

/** Traduce la preferencia al tema que se pinta. */
export function resolverTema(pref: PreferenciaTema): TemaResuelto {
 if (pref !== 'system') return pref;
 return consultaOscuro()?.matches ? 'dark' : 'light';
}

/** Lee la preferencia cacheada. Nunca lanza: en navegación privada o con el
 * almacenamiento bloqueado, `localStorage` puede tirar al acceder. */
export function leerPreferencia(): PreferenciaTema {
 try {
 const guardada = localStorage.getItem(CLAVE_TEMA);
 if (esPreferenciaValida(guardada)) return guardada;
 } catch {
 /* sin acceso a localStorage: se cae al valor por defecto */
 }
 return TEMA_POR_DEFECTO;
}

/** Estampa el tema resuelto en <html data-theme="…">. */
export function aplicarTema(pref: PreferenciaTema): TemaResuelto {
 const resuelto = resolverTema(pref);
 if (typeof document !== 'undefined') {
 document.documentElement.dataset.theme = resuelto;
 }
 return resuelto;
}

/** Guarda la preferencia y la aplica. */
export function guardarPreferencia(pref: PreferenciaTema): TemaResuelto {
 try {
 localStorage.setItem(CLAVE_TEMA, pref);
 } catch {
 /* sin persistencia: el tema sigue aplicándose en esta sesión */
 }
 return aplicarTema(pref);
}

/**
 * Mantiene el tema sincronizado con el sistema operativo mientras la
 * preferencia sea 'system'. Devuelve la función para desuscribirse.
 */
export function escucharSistema(leerPref: () => PreferenciaTema): () => void {
 const mq = consultaOscuro();
 if (!mq) return () => {};
 const alCambiar = () => {
 if (leerPref() === 'system') aplicarTema('system');
 };
 mq.addEventListener('change', alCambiar);
 return () => mq.removeEventListener('change', alCambiar);
}

/** Arranque: aplica la preferencia cacheada. */
export function inicializarTema(): TemaResuelto {
 return aplicarTema(leerPreferencia());
}
