/**
 * Escritura tolerante a columnas que aún no existen.
 *
 * Si PostgREST responde PGRST204 («Could not find the 'x' column of 'tabla'») porque falta una
 * migración, se reintenta quitando SOLO esa columna. Así el resto de lo que el usuario escribió
 * sí se guarda. Lo omitido no se esconde: se registra (log + cabecera X-Guardado-Parcial, que el
 * cliente muestra como aviso) para que nadie crea que se guardó algo que no se guardó.
 *
 * Sustituye a los bucles copiados en epk, concerts, rehearsals, leads y deals.
 */
import { registrarColumnaOmitida } from '../utils/guardadoParcial.js';

const MAX_REINTENTOS = 12;

/** Error de una escritura en PostgREST (compatible con `PostgrestError` de supabase-js). */
export interface ErrorDeEscritura {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function columnaAusenteDe(error: { message?: string } | null | undefined, tabla: string): string | null {
  const mensaje = String(error?.message || '');
  const m = mensaje.match(/Could not find the '([^']+)' column of '([^']+)'/);
  if (!m || m[2] !== tabla) return null;
  return m[1];
}

export interface ResultadoTolerante<T> {
  data: T | null;
  error: ErrorDeEscritura | null;
  /** Columnas que hubo que quitar para poder guardar. */
  omitidas: string[];
}

/**
 * @param tabla     nombre de la tabla (para reconocer el error y para el aviso)
 * @param payload   fila (o filas) a escribir; no se modifica
 * @param escribir  función que hace la escritura con el payload recibido
 */
export async function escrituraTolerante<T = unknown, P extends object = Record<string, unknown>>(
  tabla: string,
  payload: P,
  escribir: (payload: P) => PromiseLike<{ data: T | null; error: ErrorDeEscritura | null }>
): Promise<ResultadoTolerante<T>>;
export async function escrituraTolerante<T = unknown, P extends object = Record<string, unknown>>(
  tabla: string,
  payload: P[],
  escribir: (payload: P[]) => PromiseLike<{ data: T | null; error: ErrorDeEscritura | null }>
): Promise<ResultadoTolerante<T>>;
export async function escrituraTolerante<T, P extends object>(
  tabla: string,
  payload: P | P[],
  escribir: (payload: P & P[]) => PromiseLike<{ data: T | null; error: ErrorDeEscritura | null }>
): Promise<ResultadoTolerante<T>> {
  const actual = (Array.isArray(payload) ? payload.map((f) => ({ ...f })) : { ...payload }) as P & P[];
  const omitidas: string[] = [];

  for (let intento = 0; ; intento++) {
    const { data, error } = await escribir(actual);
    const faltante = error ? columnaAusenteDe(error, tabla) : null;
    // Vista por nombre de columna de las mismas filas (son copias propias: se pueden mutar).
    const filas = (Array.isArray(actual) ? actual : [actual]) as Array<Record<string, unknown>>;
    const estaEnPayload = faltante !== null && filas.some((f) => faltante in f);
    if (!faltante || !estaEnPayload || intento >= MAX_REINTENTOS) return { data, error, omitidas };

    for (const f of filas) delete f[faltante];
    omitidas.push(faltante);
    registrarColumnaOmitida(tabla, faltante);
    console.warn(`[guardado] Falta la columna '${faltante}' en '${tabla}': se guarda sin ella. Aplica la migración pendiente.`);
  }
}
