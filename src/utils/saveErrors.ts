/**
 * Aviso global de guardados fallidos.
 *
 * Envuelve `window.fetch`: cualquier escritura (POST/PUT/PATCH/DELETE) contra `/api/` que falle
 * —por red o por respuesta no-OK— emite el evento `bandmanager:save-error`, que pinta
 * `SaveErrorBanner`. Así ningún guardado puede fallar en silencio, lo llame quien lo llame
 * (`api`, `apiFetch` o un `fetch` suelto), sin tocar cada componente.
 *
 * Excluidos a propósito: lecturas (GET), peticiones canceladas, 401 (lo gestiona la sesión),
 * telemetría de fondo y las rutas públicas, que ya muestran su propio error.
 */
export const SAVE_ERROR_EVENT = 'bandmanager:save-error';

export interface SaveErrorDetail {
  /** Ruta sin query, p. ej. /api/leads/lead-1 */
  ruta: string;
  metodo: string;
  /** Código HTTP; 0 si ni siquiera hubo respuesta (sin red). */
  status: number;
  mensaje: string;
}

const METODOS_LECTURA = new Set(['GET', 'HEAD', 'OPTIONS']);
const RUTAS_IGNORADAS = [/^\/api\/public\//, /^\/api\/tracking\//, /^\/api\/auth\//, /^\/api\/telemetry/, /^\/api\/health/];

function rutaDe(url: string): string | null {
  try {
    const u = new URL(url, 'http://local.invalid');
    return u.pathname;
  } catch {
    return null;
  }
}

export function debeAvisar(metodo: string, url: string, status: number): boolean {
  if (METODOS_LECTURA.has(metodo.toUpperCase())) return false;
  const ruta = rutaDe(url);
  if (!ruta || !ruta.startsWith('/api/')) return false;
  if (RUTAS_IGNORADAS.some((r) => r.test(ruta))) return false;
  if (status === 401) return false;
  return true;
}

function textoDeError(status: number, cuerpo: any): string {
  const detalle = cuerpo && (cuerpo.message || cuerpo.error || cuerpo.detail);
  if (typeof detalle === 'string' && detalle.trim()) return detalle.trim().slice(0, 200);
  if (status === 0) return 'No hay conexión con el servidor.';
  if (status === 409) return 'Los datos cambiaron en paralelo. Recarga e inténtalo de nuevo.';
  if (status === 413) return 'El contenido es demasiado grande.';
  if (status === 429) return 'Demasiadas peticiones seguidas. Espera un momento.';
  if (status >= 500) return 'Error del servidor.';
  return `El servidor rechazó el cambio (${status}).`;
}

export function instalarAvisoDeGuardados(
  ventana: Pick<Window, 'fetch' | 'dispatchEvent'> & { __avisoGuardadosInstalado?: boolean } = window
): void {
  if (ventana.__avisoGuardadosInstalado) return;
  ventana.__avisoGuardadosInstalado = true;
  const original = ventana.fetch.bind(ventana);

  ventana.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const metodo = (init?.method || (typeof entrada === 'object' && 'method' in entrada ? entrada.method : 'GET') || 'GET').toUpperCase();

    const avisar = (status: number, cuerpo?: any) => {
      if (!debeAvisar(metodo, url, status)) return;
      const detalle: SaveErrorDetail = { ruta: rutaDe(url) || url, metodo, status, mensaje: textoDeError(status, cuerpo) };
      try {
        ventana.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT, { detail: detalle }));
      } catch {
        /* sin DOM (tests de servidor): nada que avisar */
      }
    };

    let respuesta: Response;
    try {
      respuesta = await original(entrada as any, init);
    } catch (error: any) {
      if (error?.name !== 'AbortError') avisar(0);
      throw error;
    }
    if (!respuesta.ok) {
      let cuerpo: any;
      try {
        cuerpo = await respuesta.clone().json();
      } catch {
        /* cuerpo no JSON */
      }
      avisar(respuesta.status, cuerpo);
    }
    return respuesta;
  };
}
