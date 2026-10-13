// Validación del panel de widgets que el cliente guarda en `ui_preferences.dashboard_widgets`.
// Antes el endpoint aceptaba cualquier JSON de cualquier tamaño y lo guardaba tal cual en la ficha
// del usuario. Aquí solo se comprueba la FORMA (no qué tipos de widget existen: eso es del cliente
// y cambia con el catálogo).

export const MAX_BYTES_PREFERENCIAS = 32 * 1024;
const MAX_WIDGETS = 40;
const ANCHOS = new Set([3, 4, 6, 8, 12]);
const ALTOS = new Set(['compact', 'normal', 'tall']);

const esObjetoPlano = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validarPanel(panel: unknown): string | null {
  if (!Array.isArray(panel)) return 'dashboard_widgets debe ser una lista';
  if (panel.length > MAX_WIDGETS) return `Demasiados widgets (máximo ${MAX_WIDGETS})`;
  for (const w of panel) {
    if (!esObjetoPlano(w)) return 'Widget no válido';
    if (typeof w.id !== 'string' || w.id.length < 1 || w.id.length > 80) return 'Widget con id no válido';
    if (typeof w.type !== 'string' || !/^[a-z_]{1,40}$/.test(w.type)) return 'Widget con tipo no válido';
    if (typeof w.wSpan !== 'number' || !ANCHOS.has(w.wSpan)) return 'Widget con ancho no válido';
    if (w.hSpan !== undefined && (typeof w.hSpan !== 'string' || !ALTOS.has(w.hSpan))) return 'Widget con alto no válido';
    if (typeof w.visible !== 'boolean') return 'Widget con visibilidad no válida';
    if (!Number.isInteger(w.order) || (w.order as number) < 0 || (w.order as number) > 1000) return 'Widget con orden no válido';
    if (w.title !== undefined && (typeof w.title !== 'string' || w.title.length > 120)) return 'Widget con título no válido';
    if (w.settings !== undefined && (!esObjetoPlano(w.settings) || JSON.stringify(w.settings).length > 2048)) {
      return 'Widget con ajustes no válidos';
    }
  }
  return null;
}

/** Devuelve el motivo del rechazo, o null si las preferencias se pueden guardar. */
export function validarPreferenciasUi(prefs: Record<string, unknown>): string | null {
  if (JSON.stringify(prefs).length > MAX_BYTES_PREFERENCIAS) return 'Preferencias demasiado grandes';
  if ('dashboard_widgets' in prefs) return validarPanel(prefs.dashboard_widgets);
  return null;
}
