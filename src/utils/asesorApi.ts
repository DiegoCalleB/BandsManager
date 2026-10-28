/**
 * Cliente de las rutas del Asesor de Marketing. Todas pasan por `apiFetch` (JWT + banda activa),
 * como pide AGENTS.md §5.2.
 */
import { apiFetch } from './api';
import type { Diagnostico } from './asesor/diagnostico';
import type { EstrategiaMarketing } from './asesor/estrategia';
import type { OpcionesDeHoy } from './asesor/opciones';
import type { Pieza } from './asesor/pieza';

export interface EstadoAsesor {
  hoy: string;
  diagnostico: Diagnostico;
  opciones: OpcionesDeHoy;
  semana: Array<{ fecha: string; hechas: number }>;
  estrategia: EstrategiaMarketing;
  tieneEstrategia: boolean;
}

export type AccionAsesor = 'hecho' | 'saltado' | 'pendiente';

export const obtenerHoyAsesor = () => apiFetch<EstadoAsesor>('/api/asesor/hoy');

export const prepararPieza = (tarjetaId: string) =>
  apiFetch<{ pieza: Pieza }>('/api/asesor/pieza', { method: 'POST', body: JSON.stringify({ tarjetaId }) });

export const marcarAccion = (tarjetaId: string, accion: AccionAsesor) =>
  apiFetch<{ ok: true }>('/api/asesor/accion', { method: 'POST', body: JSON.stringify({ tarjetaId, accion }) });

export const guardarEstrategia = (estrategia: EstrategiaMarketing) =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia', { method: 'PUT', body: JSON.stringify(estrategia) });

export const sugerirEstrategia = () =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia/sugerir', { method: 'POST' });
