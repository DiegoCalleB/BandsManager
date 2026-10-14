/**
 * Modo ensayo de los diagramas: oculta los diagramas para tocar el acorde de memoria y se destapa con «Ver».
 * Se guarda en el dispositivo y lo comparten todas las fichas, sin pasar props por el Atril.
 */
import { useSyncExternalStore } from 'react';

const CLAVE = 'bm_modo_ensayo_acordes';
const oyentes = new Set<() => void>();

const leer = (): boolean => {
  try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; }
};
let activo = leer();

export function fijarModoEnsayo(v: boolean): void {
  activo = v;
  try { localStorage.setItem(CLAVE, v ? '1' : '0'); } catch { /* vale solo esta sesión */ }
  oyentes.forEach((fn) => fn());
}

const suscribir = (fn: () => void): (() => void) => { oyentes.add(fn); return () => { oyentes.delete(fn); }; };

export const useModoEnsayo = (): [boolean, (v: boolean) => void] => [useSyncExternalStore(suscribir, () => activo, () => false), fijarModoEnsayo];
