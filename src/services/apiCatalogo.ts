// Catálogo compartido de salas: alta en la agenda de la banda. El email y el teléfono de la sala los copia el servidor
// al añadirla; el cliente nunca los recibe en la consulta.
import { getAuthHeaders } from './api';

export interface ResultadoAnadirSala {
  ok: boolean;
  leadId?: string;
  /** La banda ya tenía esa sala (409): no es un fallo. */
  yaEnAgenda?: boolean;
  error?: string;
}

export async function anadirSalaDelCatalogo(salaId: string): Promise<ResultadoAnadirSala> {
  const res = await fetch(`/api/catalogo/salas/${encodeURIComponent(salaId)}/anadir`, { method: 'POST', headers: getAuthHeaders(), body: '{}' });
  const cuerpo = (await res.json().catch(() => ({}))) as { leadId?: string; error?: string };
  if (res.ok && cuerpo.leadId) return { ok: true, leadId: cuerpo.leadId };
  return { ok: false, yaEnAgenda: res.status === 409, leadId: cuerpo.leadId, error: cuerpo.error || `No se pudo añadir la sala (${res.status}).` };
}

/** Sala sugerida del catálogo para una banda nueva. Sin email ni teléfono: llegan al añadirla. */
export interface SugerenciaSala {
  id: string;
  nombre: string;
  ciudad: string | null;
  region: string | null;
  tipo: string;
  aforo: number | null;
  genero: string | null;
  nivel: 'sin_verificar' | 'probable' | 'verificada';
  bandas_con_respuesta: number;
  tiene_email: boolean;
  tiene_telefono: boolean;
  motivos: string[];
}

export interface InformeAltasSalas {
  anadidas: number;
  yaEnAgenda: number;
  noDisponibles: number;
  limiteAlcanzado: boolean;
}

export async function cargarSugerenciasDeSalas(ciudad: string, genero: string, limite = 8): Promise<SugerenciaSala[]> {
  const q = new URLSearchParams({ ciudad, genero, limite: String(limite) });
  const res = await fetch(`/api/catalogo/sugerencias?${q}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`No se pudieron cargar las sugerencias (${res.status}).`);
  return ((await res.json()) as { sugerencias?: SugerenciaSala[] }).sugerencias ?? [];
}

export async function anadirVariasSalasDelCatalogo(salaIds: string[]): Promise<InformeAltasSalas> {
  const res = await fetch('/api/catalogo/salas/anadir-varias', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ salaIds }) });
  const cuerpo = (await res.json().catch(() => ({}))) as Partial<InformeAltasSalas> & { error?: string };
  if (!res.ok) throw new Error(cuerpo.error || `No se pudieron añadir las salas (${res.status}).`);
  return { anadidas: cuerpo.anadidas ?? 0, yaEnAgenda: cuerpo.yaEnAgenda ?? 0, noDisponibles: cuerpo.noDisponibles ?? 0, limiteAlcanzado: !!cuerpo.limiteAlcanzado };
}

/** Sala del catálogo tal y como la ve una banda al explorar: sin email ni teléfono, solo si los tiene. */
export interface SalaDelCatalogo {
  id: string;
  nombre: string;
  ciudad: string | null;
  region: string | null;
  tipo: string;
  aforo: number | null;
  genero: string | null;
  website: string | null;
  instagram: string | null;
  nivel: 'sin_verificar' | 'probable' | 'verificada';
  bandas_con_respuesta: number;
  tiene_email: boolean;
  tiene_telefono: boolean;
  ya_en_agenda: boolean;
}

export interface FiltrosDelCatalogo {
  texto?: string;
  lugar?: string;
  tipo?: string;
  conContacto?: boolean;
  limite?: number;
}

export interface ResultadoDelCatalogo {
  total: number;
  mostradas: number;
  salas: SalaDelCatalogo[];
}

export async function buscarSalasDelCatalogo(filtros: FiltrosDelCatalogo, signal?: AbortSignal): Promise<ResultadoDelCatalogo> {
  const q = new URLSearchParams();
  if (filtros.texto?.trim()) q.set('texto', filtros.texto.trim());
  if (filtros.lugar?.trim()) q.set('lugar', filtros.lugar.trim());
  if (filtros.tipo) q.set('tipo', filtros.tipo);
  if (filtros.conContacto) q.set('conContacto', 'true');
  q.set('limite', String(filtros.limite ?? 50));
  const res = await fetch(`/api/catalogo/salas?${q}`, { headers: getAuthHeaders(), signal });
  if (!res.ok) throw new Error(`No se pudo abrir el catálogo (${res.status}).`);
  const cuerpo = (await res.json()) as Partial<ResultadoDelCatalogo>;
  return { total: cuerpo.total ?? 0, mostradas: cuerpo.mostradas ?? 0, salas: cuerpo.salas ?? [] };
}
