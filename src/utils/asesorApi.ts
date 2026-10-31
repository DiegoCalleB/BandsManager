/**
 * Cliente de las rutas del Asesor de Marketing. Todas pasan por `apiFetch` (JWT + banda activa),
 * como pide AGENTS.md §5.2.
 */
import { apiFetch } from './api';
import type { AccionChat, Mensaje } from './asesor/chat';
import type { DiaAgenda } from './asesor/agenda';
import type { Diagnostico } from './asesor/diagnostico';
import type { EstrategiaMarketing } from './asesor/estrategia';
import type { OpcionesDeHoy } from './asesor/opciones';
import type { Pieza } from './asesor/pieza';
import type { MedioInstagram } from './asesor/instagramMedios';
import type { MetricasRed, PorMedirOtrasRedes, RedExtra } from './asesor/metricasPorRed';
import type { Medidas, PorMedir, Resumen } from './asesor/resumen';

export interface EstadoAsesor {
  hoy: string;
  diagnostico: Diagnostico;
  opciones: OpcionesDeHoy;
  semana: Array<{ fecha: string; hechas: number }>;
  porMedir: PorMedir[];
  otrasRedes: PorMedirOtrasRedes[];
  resumen: Resumen | null;
  agenda: DiaAgenda[];
  estrategia: EstrategiaMarketing;
  tieneEstrategia: boolean;
}

export type AccionAsesor = 'hecho' | 'saltado' | 'pendiente';

/** Un servidor que aún no conoce los resultados (despliegue a medias) no tumba la pantalla: llegan vacíos. */
export const obtenerHoyAsesor = async (): Promise<EstadoAsesor> => ({ porMedir: [], otrasRedes: [], resumen: null, agenda: [], ...(await apiFetch<EstadoAsesor>('/api/asesor/hoy')) });

export const prepararPieza = (tarjetaId: string) =>
  apiFetch<{ pieza: Pieza }>('/api/asesor/pieza', { method: 'POST', body: JSON.stringify({ tarjetaId }) });

export const marcarAccion = (tarjetaId: string, accion: AccionAsesor) =>
  apiFetch<{ ok: true }>('/api/asesor/accion', { method: 'POST', body: JSON.stringify({ tarjetaId, accion }) });

export interface RespuestaResultado {
  ok: true;
  titulo: string;
  veredicto: string;
  /** La lectura de la pieza en una frase, lista para enseñar. */
  mensaje: string;
}

export const guardarResultado = (p: Pick<PorMedir, 'fecha' | 'tarjetaId'>, m: Medidas) =>
  apiFetch<RespuestaResultado>('/api/asesor/resultado', { method: 'POST', body: JSON.stringify({ fecha: p.fecha, tarjetaId: p.tarjetaId, ...m }) });

/** Los números de una pieza en TikTok o YouTube Shorts: cada red mide lo suyo. */
export const guardarResultadoRed = (p: Pick<PorMedir, 'fecha' | 'tarjetaId'>, red: RedExtra, m: MetricasRed) =>
  apiFetch<RespuestaResultado>('/api/asesor/resultado', { method: 'POST', body: JSON.stringify({ fecha: p.fecha, tarjetaId: p.tarjetaId, red, ...m }) });

export const guardarEstrategia = (estrategia: EstrategiaMarketing) =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia', { method: 'PUT', body: JSON.stringify(estrategia) });

export const sugerirEstrategia = () =>
  apiFetch<{ estrategia: EstrategiaMarketing }>('/api/asesor/estrategia/sugerir', { method: 'POST' });

/** Publicaciones de Instagram que pueden ser esta pieza (el mismo día, o el siguiente). */
export const mediosDeInstagram = (p: Pick<PorMedir, 'fecha' | 'tarjetaId'>) =>
  apiFetch<{ medios: MedioInstagram[] }>(`/api/asesor/instagram/medios?fecha=${encodeURIComponent(p.fecha)}&tarjetaId=${encodeURIComponent(p.tarjetaId)}`);

/** Lo que Instagram ha medido de una publicación; lo que no dé, no viene. */
export const medidasDeInstagram = (medioId: string) =>
  apiFetch<{ medidas: Partial<Medidas> & { alcance: number } }>('/api/asesor/instagram/medidas', { method: 'POST', body: JSON.stringify({ medioId }) });

/** Pregunta libre al asesor. Responde y, como mucho, propone un botón: no cambia el plan ni guarda nada. */
export const preguntarAlAsesor = (mensajes: Mensaje[]) =>
  apiFetch<{ respuesta: string; accion: AccionChat | null }>('/api/asesor/chat', { method: 'POST', body: JSON.stringify({ mensajes }) });
