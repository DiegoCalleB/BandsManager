/**
 * Notación de acordes y tonalidades que ve cada persona (Do Re Mi / Mim  ↔  C D E / Em).
 * Se guarda en el navegador y vale para toda la app a la vez: nunca se mezclan dos notaciones en pantalla.
 * Los datos se guardan siempre en formato canónico americano (ver utils/notacionAcordes.ts).
 */
import { useCallback, useSyncExternalStore } from 'react';
import { formatearTonalidad, NOTACION_POR_DEFECTO, type Notacion } from '../utils/notacionAcordes';

const CLAVE = 'bm_notacion';
const oyentes = new Set<() => void>();

export function leerNotacion(): Notacion {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'ES' || v === 'EN' ? v : NOTACION_POR_DEFECTO;
  } catch {
    return NOTACION_POR_DEFECTO; // almacenamiento bloqueado (modo privado): se usa la de por defecto
  }
}

export function guardarNotacion(n: Notacion): void {
  try { localStorage.setItem(CLAVE, n); } catch { /* sin almacenamiento: vale solo para esta sesión */ }
  sesion = n;
  oyentes.forEach((o) => o());
}

// Respaldo en memoria por si localStorage no funciona.
let sesion: Notacion | null = null;
const actual = (): Notacion => sesion ?? leerNotacion();

function suscribir(cb: () => void): () => void {
  oyentes.add(cb);
  const alCambiarOtraPestana = (e: StorageEvent) => { if (e.key === CLAVE) { sesion = null; cb(); } };
  window.addEventListener('storage', alCambiarOtraPestana);
  return () => { oyentes.delete(cb); window.removeEventListener('storage', alCambiarOtraPestana); };
}

/** [notación, cambiarla, formatear tonalidad]. El setter acepta un valor o una función, como `useState`. */
export function useNotacion(): [Notacion, (n: Notacion | ((previa: Notacion) => Notacion)) => void, (t?: string | null) => string] {
  const notacion = useSyncExternalStore(suscribir, actual, () => NOTACION_POR_DEFECTO);
  const cambiar = useCallback((n: Notacion | ((previa: Notacion) => Notacion)) => {
    guardarNotacion(typeof n === 'function' ? n(actual()) : n);
  }, []);
  const formatear = useCallback((t?: string | null) => formatearTonalidad(t, notacion), [notacion]);
  return [notacion, cambiar, formatear];
}

/** Función para pintar una tonalidad guardada (canónica) en la notación elegida. */
export function useFormatoTono(): (tonalidad?: string | null) => string {
  return useNotacion()[2];
}
