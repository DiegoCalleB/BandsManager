/**
 * Cliente de las rutas de promoción: enlaces cortos, redacción de la campaña y referidos.
 * Todas pasan por `apiFetch` (JWT + banda activa), como pide AGENTS.md §5.2.
 */
import { apiFetch } from './api';
import type { CanalPublicacion, HitoId } from './campanaConcierto';

export type DestinoEnlace = 'entradas' | 'concierto' | 'epk' | 'fans';
export type CanalEnlace = 'instagram' | 'tiktok' | 'whatsapp' | 'facebook' | 'youtube' | 'email' | 'cartel' | 'web' | 'otro';

export interface EnlaceCorto {
  code: string;
  url: string;
  destino: DestinoEnlace;
  canal: CanalEnlace;
  concertId: string | null;
  clics: number;
  personas: number;
  ultimoClic: string | null;
  ultimos7: number[];
}

export interface ListadoEnlaces {
  base: string;
  dias: number;
  /** true si se alcanzó el tope de clics leídos: las cifras son un mínimo. */
  truncado: boolean;
  limite: number;
  totales: { clics: number; personas: number; ultimos7: number[] };
  porCanal: Array<{ canal: string; clics: number }>;
  enlaces: EnlaceCorto[];
}

export interface PiezaRedactada {
  hito: HitoId;
  canal: CanalPublicacion;
  enlace: string;
  destino: DestinoEnlace;
  variantes: [string, string];
  hashtags: string[];
  generadaPorIA: boolean;
}

export interface EstadoReferidos {
  codigo: string;
  url: string;
  invitadas: number;
}

export const listarEnlaces = (concertId?: string) =>
  apiFetch<ListadoEnlaces>(`/api/short-links${concertId ? `?concertId=${encodeURIComponent(concertId)}` : ''}`);

export const crearEnlace = (datos: { concertId?: string | null; destino: DestinoEnlace; canal: CanalEnlace }) =>
  apiFetch<{ code: string; url: string; creado: boolean }>('/api/short-links', { method: 'POST', body: JSON.stringify(datos) });

export const borrarEnlace = (code: string) => apiFetch<{ success: boolean }>(`/api/short-links/${encodeURIComponent(code)}`, { method: 'DELETE' });

export const redactarPieza = (datos: { concertId: string; hito: HitoId; canal: CanalPublicacion; usarIA?: boolean }) =>
  apiFetch<PiezaRedactada>('/api/campana-concierto/redactar', { method: 'POST', body: JSON.stringify(datos) });

export const obtenerReferidos = () => apiFetch<EstadoReferidos>('/api/referidos');

export const atribuirReferido = (codigo: string) =>
  apiFetch<{ atribuido: boolean }>('/api/referidos/atribuir', { method: 'POST', body: JSON.stringify({ codigo }) });
