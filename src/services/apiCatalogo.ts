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
  website: string | null;
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
  posiblemente_cerrada: boolean;
  ya_en_agenda: boolean;
  direccion: string | null;
  lat: number | null;
  lon: number | null;
  /** El punto es el de su ciudad, no el del local. */
  coordenadas_aprox: boolean;
  /** Cuántos de los datos que importan a una banda tiene la ficha (0-100). */
  completitud: number;
  /** De dónde sale la información; `osm` obliga a citar OpenStreetMap. */
  fuentes: string[];
}

export interface FiltrosDelCatalogo {
  texto?: string;
  lugar?: string;
  tipo?: string;
  conContacto?: boolean;
  /** Rango de aforo (personas). Vacío = sin límite por ese lado; las salas sin dato de aforo quedan fuera si hay alguno. */
  aforoMin?: string | number;
  aforoMax?: string | number;
  limite?: number;
}

export interface ResultadoDelCatalogo {
  total: number;
  mostradas: number;
  salas: SalaDelCatalogo[];
}

export async function buscarSalasDelCatalogo(filtros: FiltrosDelCatalogo, signal?: AbortSignal): Promise<ResultadoDelCatalogo> {
  const q = parametros(filtros);
  q.set('limite', String(filtros.limite ?? 50));
  const res = await fetch(`/api/catalogo/salas?${q}`, { headers: getAuthHeaders(), signal });
  if (!res.ok) throw new Error(`No se pudo abrir el catálogo (${res.status}).`);
  const cuerpo = (await res.json()) as Partial<ResultadoDelCatalogo>;
  return { total: cuerpo.total ?? 0, mostradas: cuerpo.mostradas ?? 0, salas: cuerpo.salas ?? [] };
}

function parametros(filtros: FiltrosDelCatalogo): URLSearchParams {
  const q = new URLSearchParams();
  if (filtros.texto?.trim()) q.set('texto', filtros.texto.trim());
  if (filtros.lugar?.trim()) q.set('lugar', filtros.lugar.trim());
  if (filtros.tipo) q.set('tipo', filtros.tipo);
  if (filtros.conContacto) q.set('conContacto', 'true');
  if (String(filtros.aforoMin ?? '').trim()) q.set('aforoMin', String(filtros.aforoMin).trim());
  if (String(filtros.aforoMax ?? '').trim()) q.set('aforoMax', String(filtros.aforoMax).trim());
  return q;
}

/** Una sala situada en el mapa: lo mínimo para pintarla; la ficha se pide al abrirla. */
export interface PuntoDelMapa {
  id: string;
  nombre: string;
  ciudad: string | null;
  tipo: string;
  nivel: SalaDelCatalogo['nivel'];
  lat: number;
  lon: number;
  coordenadas_aprox: boolean;
  ya_en_agenda: boolean;
}

export interface ResultadoMapa {
  /** Salas que encajan con los filtros, estén o no situadas en el mapa. */
  total: number;
  puntos: PuntoDelMapa[];
}

export async function cargarMapaDelCatalogo(filtros: FiltrosDelCatalogo, signal?: AbortSignal): Promise<ResultadoMapa> {
  const res = await fetch(`/api/catalogo/salas/mapa?${parametros(filtros)}`, { headers: getAuthHeaders(), signal });
  if (!res.ok) throw new Error(`No se pudo cargar el mapa (${res.status}).`);
  const cuerpo = (await res.json()) as Partial<ResultadoMapa>;
  return { total: cuerpo.total ?? 0, puntos: cuerpo.puntos ?? [] };
}

export async function cargarFichaDeSala(salaId: string, signal?: AbortSignal): Promise<SalaDelCatalogo | null> {
  const res = await fetch(`/api/catalogo/salas/${encodeURIComponent(salaId)}`, { headers: getAuthHeaders(), signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo abrir la ficha (${res.status}).`);
  return (await res.json()) as SalaDelCatalogo;
}

export interface FestivalDelDirectorio {
  slug: string;
  nombre: string;
  ciudad: string;
  provincia: string;
  estilos: string[];
  web: string | null;
  descripcion: string;
  edicion: { inicio: string; fin: string } | null;
  convocatoria: { url: string; cierre: string | null; resumen: string } | null;
  ya_en_agenda: boolean;
}

export interface FiltrosDeFestivales {
  texto?: string;
  lugar?: string;
  soloConConvocatoria?: boolean;
}

export async function buscarFestivalesDelDirectorio(filtros: FiltrosDeFestivales, signal?: AbortSignal): Promise<{ total: number; festivales: FestivalDelDirectorio[] }> {
  const q = new URLSearchParams();
  if (filtros.texto?.trim()) q.set('texto', filtros.texto.trim());
  if (filtros.lugar?.trim()) q.set('lugar', filtros.lugar.trim());
  if (filtros.soloConConvocatoria) q.set('soloConConvocatoria', 'true');
  const res = await fetch(`/api/catalogo/festivales?${q}`, { headers: getAuthHeaders(), signal });
  if (!res.ok) throw new Error(`No se pudo abrir el directorio de festivales (${res.status}).`);
  const cuerpo = (await res.json()) as { total?: number; festivales?: FestivalDelDirectorio[] };
  return { total: cuerpo.total ?? 0, festivales: cuerpo.festivales ?? [] };
}

export async function anadirFestivalDelDirectorio(slug: string): Promise<ResultadoAnadirSala> {
  const res = await fetch(`/api/catalogo/festivales/${encodeURIComponent(slug)}/anadir`, { method: 'POST', headers: getAuthHeaders(), body: '{}' });
  const cuerpo = (await res.json().catch(() => ({}))) as { leadId?: string; error?: string };
  if (res.ok && cuerpo.leadId) return { ok: true, leadId: cuerpo.leadId };
  return { ok: false, yaEnAgenda: res.status === 409, error: cuerpo.error || `No se pudo añadir el festival (${res.status}).` };
}
