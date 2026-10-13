import { DEFAULT_DASHBOARD_WIDGETS, type DashboardWidgetConfig } from '../types/dashboardWidgets';

/** Orden del panel de widgets: funciones puras para poder probarlas sin pintar el Dashboard. */

/**
 * Sube o baja un widget una posición ENTRE LOS VISIBLES. La lista completa puede llevar widgets
 * ocultos (el plan no los permite o están desactivados); mover por índice de la lista completa,
 * como se hacía, intercambiaba con un widget que el usuario ni ve y parecía que no pasaba nada.
 * Devuelve la misma lista si no hay a dónde mover.
 */
export function moverEntreVisibles<T extends { id: string }>(
  todos: readonly T[],
  visibles: readonly T[],
  indiceVisible: number,
  direccion: 'up' | 'down',
): T[] {
  const vecino = visibles[indiceVisible + (direccion === 'up' ? -1 : 1)];
  const actual = visibles[indiceVisible];
  if (!vecino || !actual) return [...todos];
  const copia = [...todos];
  const a = copia.findIndex((w) => w.id === actual.id);
  const b = copia.findIndex((w) => w.id === vecino.id);
  if (a === -1 || b === -1) return copia;
  [copia[a], copia[b]] = [copia[b], copia[a]];
  return copia;
}

/* ------------------------------------------------------------------ formato guardado (v2) */

/**
 * Lo que se guarda en `ui_preferences.dashboard_widgets`.
 *  · `base`: el panel del usuario, el mismo en todas sus bandas.
 *  · `porBanda`: paneles propios de una banda. Hoy no se rellena desde la pantalla (todas las
 *    bandas usan `base`), pero el formato ya lo admite: activarlo no exigirá otra migración.
 */
export interface PanelGuardado {
  version: 2;
  base: DashboardWidgetConfig[];
  porBanda: Record<string, DashboardWidgetConfig[]>;
}

/** Widgets que ya no existen: se quitan de los paneles guardados. */
export const TIPOS_RETIRADOS: ReadonlySet<string> = new Set(['growth_guidance', 'finances_summary', 'social_fans_chart']);
/** Widgets nuevos de esta versión: llegan una sola vez, al final, a quien ya tenía un panel guardado. */
const NOVEDADES_V2 = ['marketing'];
/** Lo que se ve en el móvil por defecto al añadir un widget: lo esencial. */
export const ESENCIALES_MOVIL: ReadonlySet<string> = new Set(['calendar', 'executive_summary', 'crm_pipeline', 'roi_banda']);

export const visibleEnMovil = (w: { movil?: boolean }) => w.movil !== false;

/** Quita los retirados y deja el `order` seguido (0, 1, 2…): al quitar widgets quedaban huecos. */
const sinRetirados = (lista: DashboardWidgetConfig[]) =>
  lista
    .filter((w) => !TIPOS_RETIRADOS.has(w.type))
    .sort((a, b) => a.order - b.order)
    .map((w, i) => ({ ...w, order: i }));
const esLista = (v: unknown): v is DashboardWidgetConfig[] => Array.isArray(v);

/**
 * Lee lo guardado, sea el formato antiguo (una lista) o el v2, y lo deja en v2.
 * `migrado` es true si hubo que cambiar algo: quien llama debe guardarlo una vez para que no se repita.
 * Devuelve null si no hay nada guardado (se usará el panel por defecto).
 */
export function leerPanel(guardado: unknown): { panel: PanelGuardado; migrado: boolean } | null {
  if (esLista(guardado)) {
    if (guardado.length === 0) return null;
    // Panel de antes del formato v2: lo que ya veían en el móvil se conserva (`movil: true`).
    const base: DashboardWidgetConfig[] = sinRetirados(guardado).map((w) => ({ ...w, movil: w.movil ?? true }));
    for (const tipo of NOVEDADES_V2) {
      if (base.some((w) => w.type === tipo)) continue;
      const defecto = DEFAULT_DASHBOARD_WIDGETS.find((w) => w.type === tipo);
      if (defecto) base.push({ ...defecto, order: base.length });
    }
    return { panel: { version: 2, base, porBanda: {} }, migrado: true };
  }
  const g = guardado as Partial<PanelGuardado> | null;
  if (g && typeof g === 'object' && g.version === 2 && esLista(g.base)) {
    const porBanda: Record<string, DashboardWidgetConfig[]> = {};
    for (const [banda, lista] of Object.entries(g.porBanda ?? {})) if (esLista(lista)) porBanda[banda] = sinRetirados(lista);
    const base = sinRetirados(g.base);
    const migrado = base.length !== g.base.length || Object.keys(porBanda).some((b) => porBanda[b].length !== g.porBanda![b].length);
    return { panel: { version: 2, base, porBanda }, migrado };
  }
  return null;
}

/** El panel que toca ver en una banda: el suyo si lo tiene, si no el del usuario. */
export function panelDeBanda(panel: PanelGuardado, bandId?: string): DashboardWidgetConfig[] {
  return (bandId && panel.porBanda[bandId]) || panel.base;
}

/** Guarda un panel nuevo. Hoy siempre en `base` (mismo panel en todas las bandas). */
export function conPanel(panel: PanelGuardado | null, widgets: DashboardWidgetConfig[]): PanelGuardado {
  return { version: 2, base: widgets, porBanda: panel?.porBanda ?? {} };
}
