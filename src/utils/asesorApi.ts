/**
 * Cliente de las rutas del Asesor de Marketing. Todas pasan por `apiFetch` (JWT + banda activa),
 * como pide AGENTS.md §5.2.
 */
import { apiFetch } from './api';
import type { Diagnostico, Tarjeta } from './asesor/diagnostico';
import type { EstrategiaMarketing } from './asesor/estrategia';

export interface EstadoAsesor {
  hoy: string;
  diagnostico: Diagnostico;
  tarjetas: Tarjeta[];
  estrategia: EstrategiaMarketing;
  tieneEstrategia: boolean;
}

export const obtenerHoyAsesor = () => apiFetch<EstadoAsesor>('/api/asesor/hoy');

export const guardarEstrategia = (estrategia: EstrategiaMarketing) =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia', { method: 'PUT', body: JSON.stringify(estrategia) });

export const sugerirEstrategia = () =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia/sugerir', { method: 'POST' });
