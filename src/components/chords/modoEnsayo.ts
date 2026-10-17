/**
 * Modo ensayo de los diagramas: oculta los diagramas para tocar el acorde de memoria y se destapa con «Ver».
 * Se guarda en el dispositivo y lo comparten todas las fichas, sin pasar props por el Atril.
 */
import { useSyncExternalStore } from 'react';

/** Ajuste booleano guardado en el dispositivo y compartido por todas las fichas. */
function crearAjuste(clave: string): [() => [boolean, (v: boolean) => void], (v: boolean) => void] {
  const oyentes = new Set<() => void>();
  let activo = false;
  try { activo = localStorage.getItem(clave) === '1'; } catch { /* sin almacenamiento */ }
  const fijar = (v: boolean): void => {
    activo = v;
    try { localStorage.setItem(clave, v ? '1' : '0'); } catch { /* vale solo esta sesión */ }
    oyentes.forEach((fn) => fn());
  };
  const suscribir = (fn: () => void): (() => void) => { oyentes.add(fn); return () => { oyentes.delete(fn); }; };
  return [() => [useSyncExternalStore(suscribir, () => activo, () => false), fijar], fijar];
}

export const [useModoEnsayo, fijarModoEnsayo] = crearAjuste('bm_modo_ensayo_acordes');
/** Pentagrama abierto de entrada en todas las fichas (opcional; por defecto cada una lo abre con su botón). */
export const [usePentagramaSiempre] = crearAjuste('bm_pentagrama_siempre');
