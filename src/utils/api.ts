// Centralized authenticated API fetch helper for BandsManager

/**
 * IMPORTANTE: `apiFetch` devuelve el JSON YA PARSEADO, no una `Response`.
 *
 * Llamar a `.json()` o mirar `.ok` sobre lo que devuelve es el error que rompía el
 * generador de Reels con "res.json is not a function". Si necesitas la `Response`
 * cruda (streams, cabeceras, blobs), usa `apiFetchRaw`.
 */

export class ApiRequestError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

/** Banda activa del usuario, para que el backend sepa sobre qué banda opera la petición. */
export function getActiveBandId(): string {
  try {
    const userStr = localStorage.getItem('bakandeya_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.band_id) return String(u.band_id);
    }
  } catch (e) {
    /* localStorage con JSON corrupto: seguimos sin banda explícita */
  }
  return '';
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  // Sin esta cabecera el backend caía siempre en la banda por defecto de la sesión, así que
  // las rutas de IA (Reels, tono de voz...) podían responder con datos de otra banda.
  const bandId = getActiveBandId();
  if (bandId && !headers['x-band-id']) {
    headers['x-band-id'] = bandId;
  }

  return headers;
}

/** `fetch` autenticado que devuelve la `Response` sin tocar. Para blobs, streams o SSE. */
export async function apiFetchRaw(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, headers: buildHeaders(options) });
}

export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetchRaw(url, options);

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detailedMessage =
        data.message || data.error || data.detail || (typeof data === 'string' ? data : `Error ${res.status}: ${res.statusText}`);
      throw new ApiRequestError(typeof detailedMessage === 'string' ? detailedMessage : JSON.stringify(detailedMessage), res.status, data);
    }
    return data;
  } else {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new ApiRequestError(`Error ${res.status}: ${text.slice(0, 100) || res.statusText}`, res.status, text);
    }
    return { success: true, text } as unknown as T;
  }
}

export async function safeJsonFetch<T = any>(res: Response, fallbackValue: T = {} as T): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${text.slice(0, 100) || res.statusText}`);
    }
    return fallbackValue;
  }
  return res.json().catch(() => fallbackValue);
}
