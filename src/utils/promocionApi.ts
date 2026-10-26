/**
 * Cliente de las rutas de promoción: enlaces cortos, redacción de la campaña y referidos.
 * Todas pasan por `apiFetch` (JWT + banda activa), como pide AGENTS.md §5.2.
 */
import { apiFetch } from './api';
import type { CanalPublicacion, HitoId } from './campanaConcierto';
import type { CartelConfig } from './cartel/config';
import type { AdnCartel } from './cartel/adn';
import type { BriefIdea, IdeaCartel } from './cartel/idea';

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

import type { EstiloCartel } from './cartel/estilos';
export type { EstiloCartel };

export const generarFondoCartel = (datos: { concertId: string; estilo: EstiloCartel; instrucciones?: string; idea?: IdeaCartel; conBoceto?: boolean; encuadre?: 'ventana' | 'sangre'; conTexto?: boolean }) =>
  apiFetch<{ url: string; estilo: EstiloCartel; conTexto?: boolean; textoOk?: boolean }>('/api/cartel/fondo', { method: 'POST', body: JSON.stringify(datos) });

const rutaCartel = (concertId: string, tramo: string) => `/api/cartel/${encodeURIComponent(concertId)}/${tramo}`;

export const guardarConfigCartel = (concertId: string, config: CartelConfig) =>
  apiFetch<{ config: CartelConfig }>(rutaCartel(concertId, 'config'), { method: 'PUT', body: JSON.stringify(config) });

/** El cartel final (PNG de feed): pasa a ser el cartel del bolo en su página pública. */
export const subirImagenCartel = (concertId: string, png: Blob) =>
  apiFetch<{ url: string }>(rutaCartel(concertId, 'imagen'), { method: 'PUT', body: png, headers: { 'Content-Type': 'image/png' } });

export const subirFotoCartel = (concertId: string, jpeg: Blob) =>
  apiFetch<{ url: string }>(rutaCartel(concertId, 'foto'), { method: 'POST', body: jpeg, headers: { 'Content-Type': 'image/jpeg' } });

/** Un logo de otra banda del bolo (PNG ya reescalado): entra en la fila de logos del cartel. */
export const subirLogoCartel = (concertId: string, png: Blob) =>
  apiFetch<{ url: string; logos: string[] }>(rutaCartel(concertId, 'logo'), { method: 'POST', body: png, headers: { 'Content-Type': 'image/png' } });

export const quitarLogoCartel = (concertId: string, url: string) =>
  apiFetch<{ logos: string[] }>(rutaCartel(concertId, 'logo'), { method: 'DELETE', body: JSON.stringify({ url }) });

export const obtenerAdnCartel = () => apiFetch<{ adn: AdnCartel }>('/api/cartel/adn');

export const guardarAdnCartel = (adn: AdnCartel) =>
  apiFetch<{ adn: AdnCartel }>('/api/cartel/adn', { method: 'PUT', body: JSON.stringify(adn) });

/** Una imagen de referencia (JPEG ya reescalado): la IA la mira para parecerse a la banda. */
export const subirReferenciaCartel = (jpeg: Blob) =>
  apiFetch<{ url: string; adn: AdnCartel }>('/api/cartel/referencias', { method: 'POST', body: jpeg, headers: { 'Content-Type': 'image/jpeg' } });

/** El boceto de la persona (JPEG ya reescalado): un solo fichero por banda; subir otro sustituye al anterior. */
export const subirBocetoCartel = (jpeg: Blob) =>
  apiFetch<{ ok: true }>('/api/cartel/idea', { method: 'POST', body: jpeg, headers: { 'Content-Type': 'image/jpeg' } });

export const quitarBocetoCartel = () => apiFetch<{ ok: true }>('/api/cartel/idea', { method: 'DELETE' });

/** Lo que se le va a pedir a la IA, en inglés, sin generar ninguna imagen (no cuesta una imagen). */
export const previsualizarBriefCartel = (datos: { idea: IdeaCartel; conBoceto: boolean }) =>
  apiFetch<{ brief: BriefIdea | null; traducido: boolean; conBoceto: boolean }>('/api/cartel/brief', { method: 'POST', body: JSON.stringify(datos) });
