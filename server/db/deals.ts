import crypto from 'crypto';
import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';
import { dbUpsertConcert } from './concerts.js';
import { dbUpsertLead, dbGetLeadById } from './leads.js';
import { invalidateBandStateCache } from './sync.js';
import { loadState, saveState } from '../state.js';
import { normalizarApoyoPorcentaje } from '../utils/dealSupport.js';

export interface DealData {
  id?: string;
  band_id: string;
  lead_id?: string | null;
  concert_id?: string | null;
  token?: string;
  nombre_evento: string;
  lugar_sala: string;
  ciudad?: string;
  fecha_evento: string;
  hora_llegada?: string;
  hora_concierto?: string;
  tipo_remuneracion?: 'cache_fijo' | 'taquilla' | 'hibrido';
  cache_base?: number;
  total_acordado?: number;
  comision_porcentaje?: number;
  comision_importe?: number;
  neto_banda?: number;
  /** Apoyo voluntario a BandManager elegido por la banda (NO forma parte del contrato ni del sello). */
  apoyo_porcentaje?: number | null;
  forma_pago?: 'efectivo' | 'transferencia' | 'pago_diferido_ayto';
  rider_incluido?: boolean;
  rider_texto?: string;
  rider_validado_por_sala?: boolean;
  hospitalidad_notas?: string;
  estado?: 'pendiente' | 'confirmado' | 'cancelado';
  nombre_firmante?: string;
  cargo_firmante?: string;
  firma_imagen?: string;
  firma_ip?: string;
  firma_user_agent?: string;
  firma_timestamp?: string;
  contrato_sha256?: string;
  created_at?: string;
  updated_at?: string;
}

/** Error de negocio con código HTTP, para que la ruta responda 409/404/503 en vez de un 400/500 genérico. */
export class DealError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'DealError';
    this.status = status;
  }
}

/**
 * Porcentaje de comisión de BandManager sobre el bolo. De momento es 0: la comisión obligatoria
 * está en pausa y BandManager pide una aportación VOLUNTARIA al cerrar el bolo (ver
 * server/utils/dealSupport.ts y docs/design/stripe-connect-comision-bolos.md). Lo fija SIEMPRE el
 * servidor: antes se aceptaba el valor que mandara el cliente. Si más adelante se cobra con
 * Stripe Connect, este es el único punto a cambiar (las columnas comision_* ya existen).
 */
export const COMISION_PORCENTAJE_DEFAULT = 0;

export function calcularComision(total: number, porcentaje = COMISION_PORCENTAJE_DEFAULT) {
  const importe = Math.round(((Number(total) || 0) * porcentaje) / 100 * 100) / 100;
  const neto = Math.max(0, Math.round(((Number(total) || 0) - importe) * 100) / 100);
  return { comision_porcentaje: porcentaje, comision_importe: importe, neto_banda: neto };
}

/** Supabase es la ÚNICA fuente de verdad de los acuerdos (nada de memoria ni disco efímero). */
function tablaDeals() {
  return getSupabase().from('concert_deals');
}

function fallo(error: any, accion: string): never {
  const msg = String(error?.message || error || '');
  // 42P01 = tabla inexistente (Postgres); PGRST205 = tabla fuera del schema cache (PostgREST)
  if (error?.code === '42P01' || error?.code === 'PGRST205' || /concert_deals/.test(msg) && /not find|does not exist/i.test(msg)) {
    throw new DealError(
      'La tabla concert_deals no existe en la base de datos: falta aplicar la migración supabase/migrations/20261005_concert_deals.sql.',
      503
    );
  }
  throw new DealError(`No se pudo ${accion} el acuerdo en la base de datos: ${msg}`, 500);
}

/**
 * Sello SHA-256 de los términos del acuerdo (versión 2). Cubre TODOS los términos económicos y
 * logísticos —incluida la comisión—, no solo sala/fecha/total como la versión 1, para que
 * cualquier cambio posterior en cualquiera de ellos invalide el sello. Cuando se pasan los datos
 * de la firma (nombre, cargo, instante y huella de la imagen) también quedan sellados.
 */
export function computeDealSha256(deal: DealData): string {
  const sha = (s?: string) => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
  const canonicalString = [
    'v:2',
    `band:${deal.band_id}`,
    `evento:${(deal.nombre_evento || '').trim()}`,
    `sala:${(deal.lugar_sala || '').trim().toLowerCase()}`,
    `ciudad:${(deal.ciudad || '').trim().toLowerCase()}`,
    `fecha:${deal.fecha_evento}`,
    `tipo:${deal.tipo_remuneracion || 'cache_fijo'}`,
    `cache:${Number(deal.cache_base ?? 0).toFixed(2)}`,
    `total:${Number(deal.total_acordado ?? deal.cache_base ?? 0).toFixed(2)}`,
    `comision:${Number(deal.comision_porcentaje ?? 0).toFixed(2)}`,
    `pago:${deal.forma_pago || 'efectivo'}`,
    `llegada:${deal.hora_llegada || '18:30'}`,
    `show:${deal.hora_concierto || '21:30'}`,
    `rider:${Boolean(deal.rider_incluido)}:${sha(deal.rider_texto)}`,
    `hospitalidad:${sha(deal.hospitalidad_notas)}`,
    `firmante:${(deal.nombre_firmante || '').trim()}|${(deal.cargo_firmante || '').trim()}`,
    // Normalizado: Postgres devuelve timestamptz como "…+00:00" y aquí se genera con "Z"; sin
    // normalizar, recalcular el sello desde la fila guardada daría un hash distinto.
    `firmado:${deal.firma_timestamp ? new Date(deal.firma_timestamp).toISOString() : ''}`,
    `firma:${sha(deal.firma_imagen)}`
  ].join('|');

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Generates a cryptographically random, URL-safe access token for a deal.
 */
export function generateDealToken(): string {
  const random = crypto.randomBytes(18).toString('base64url');
  return `dl_${random}`;
}

/**
 * Gets all deals for a specific band (strictly scoped by band_id).
 */
export async function dbGetDeals(bandId: string): Promise<DealData[]> {
  const cleanId = cleanBandId(bandId);
  if (!cleanId || cleanId === '__sin_banda__') return [];

  const { data, error } = await tablaDeals()
    .select('*')
    .eq('band_id', cleanId)
    .order('created_at', { ascending: false });
  if (error) fallo(error, 'leer los');
  return (data || []) as DealData[];
}

/**
 * Gets a single deal by its unique public token.
 */
export async function dbGetDealByToken(token: string): Promise<DealData | null> {
  if (!token || typeof token !== 'string') return null;
  const { data, error } = await tablaDeals().select('*').eq('token', token.trim()).maybeSingle();
  if (error) fallo(error, 'leer el');
  return (data as DealData) || null;
}

/**
 * Gets one deal by id, always scoped to the band (a band can never read another band's deal).
 */
export async function dbGetDealById(id: string, bandId: string): Promise<DealData | null> {
  const cleanId = cleanBandId(bandId);
  if (!id || !cleanId) return null;
  const { data, error } = await tablaDeals()
    .select('*')
    .eq('band_id', cleanId)
    .eq('id', id)
    .maybeSingle();
  if (error) fallo(error, 'leer el');
  return (data as DealData) || null;
}

/**
 * Gets the active deal associated with a lead.
 */
export async function dbGetDealByLeadId(leadId: string, bandId: string): Promise<DealData | null> {
  const cleanId = cleanBandId(bandId);
  if (!cleanId || !leadId) return null;

  const { data, error } = await tablaDeals()
    .select('*')
    .eq('band_id', cleanId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fallo(error, 'leer el');
  return (data as DealData) || null;
}

/**
 * Creates or edits a deal from the band dashboard.
 *
 * - Editar un acuerdo YA FIRMADO está prohibido (409): antes un POST con su id lo dejaba en
 *   `pendiente`, borraba la firma y le cambiaba el token, así que el enlace que ya tenía la sala
 *   dejaba de funcionar y los términos firmados podían cambiarse sin dejar rastro.
 * - Editar un acuerdo pendiente conserva su token y su fecha de creación.
 * - El id solo se reutiliza si el acuerdo existe PARA ESTA BANDA; un id ajeno se ignora.
 * - La comisión la calcula el servidor; nunca se acepta la que mande el cliente.
 */
export async function dbUpsertDeal(
  deal: Partial<DealData> & { band_id: string; lugar_sala: string; fecha_evento: string },
  bandId: string
): Promise<DealData> {
  const targetBandId = cleanBandId(bandId);
  if (!targetBandId || targetBandId === '__sin_banda__') {
    throw new DealError('ID de banda inválido para persistir el acuerdo', 400);
  }

  const existing = deal.id ? await dbGetDealById(deal.id, targetBandId) : null;
  if (existing?.estado === 'confirmado') {
    throw new DealError(
      'Este acuerdo ya está firmado por la sala y no se puede modificar. Crea un acuerdo nuevo si las condiciones han cambiado.',
      409
    );
  }

  const cacheBase = Number(deal.cache_base ?? 0);
  const totalAcordado = Number(deal.total_acordado ?? cacheBase);
  const comision = calcularComision(totalAcordado);

  const payload: DealData = {
    id: existing?.id || `deal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    band_id: targetBandId,
    lead_id: deal.lead_id || null,
    concert_id: existing?.concert_id || null,
    token: existing?.token || generateDealToken(),
    nombre_evento: deal.nombre_evento || `Concierto en ${deal.lugar_sala}`,
    lugar_sala: deal.lugar_sala,
    ciudad: deal.ciudad || '',
    fecha_evento: deal.fecha_evento,
    hora_llegada: deal.hora_llegada || '18:30',
    hora_concierto: deal.hora_concierto || '21:30',
    tipo_remuneracion: deal.tipo_remuneracion || 'cache_fijo',
    cache_base: cacheBase,
    total_acordado: totalAcordado,
    ...comision,
    // null = no eligió (sugerencia por defecto), 0 = no apoyar, 0,5-20 = su elección. Si no llega en
    // una edición, se conserva lo que ya había elegido.
    apoyo_porcentaje:
      deal.apoyo_porcentaje !== undefined
        ? normalizarApoyoPorcentaje(deal.apoyo_porcentaje)
        : (existing?.apoyo_porcentaje ?? null),
    forma_pago: deal.forma_pago || 'efectivo',
    rider_incluido: deal.rider_incluido ?? true,
    rider_texto: deal.rider_texto || '',
    rider_validado_por_sala: false,
    hospitalidad_notas: deal.hospitalidad_notas || '',
    estado: existing?.estado === 'cancelado' ? 'cancelado' : 'pendiente',
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let { data, error } = await tablaDeals()
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .maybeSingle();

  // La columna apoyo_porcentaje es posterior al resto del esquema: si la migración aún no está
  // aplicada, el acuerdo se guarda igualmente (sin esa preferencia) en vez de dejar de funcionar.
  if (error && /apoyo_porcentaje/.test(String(error.message || ''))) {
    console.warn('[deals] Falta la columna apoyo_porcentaje (migración 20261007): se guarda sin ella.');
    const { apoyo_porcentaje: _omitida, ...sinApoyo } = payload;
    ({ data, error } = await tablaDeals().upsert(sinApoyo, { onConflict: 'id' }).select('*').maybeSingle());
  }
  if (error) fallo(error, 'guardar el');

  return (data as DealData) || payload;
}

/**
 * Signs a deal from the public link (/deal/:token).
 *
 * La firma es de UN SOLO USO y atómica: el UPDATE exige `estado = 'pendiente'`, de modo que dos
 * firmas simultáneas (o una segunda firma posterior) no pueden pisar la primera. Antes cualquiera
 * con el enlace podía volver a firmar y sobrescribir nombre, firma e IP del firmante original.
 * Una vez firmado: calcula el sello SHA-256 (v2), pasa a 'confirmado' y lanza el efecto dominó:
 * 1. Crea el bolo en la agenda de la banda (concerts)
 * 2. Marca el lead asociado como 'confirmado'
 */
export async function dbSignDeal(
  token: string,
  signData: {
    nombre_firmante: string;
    cargo_firmante?: string;
    firma_imagen: string;
    firma_ip: string;
    firma_user_agent: string;
    rider_validado_por_sala: boolean;
  }
): Promise<{ deal: DealData; concertId?: string }> {
  const deal = await dbGetDealByToken(token);
  if (!deal) {
    throw new DealError('Acuerdo no encontrado o token inválido', 404);
  }
  if (deal.estado === 'confirmado') {
    throw new DealError('Este acuerdo ya fue firmado y no admite una nueva firma.', 409);
  }
  if (deal.estado === 'cancelado') {
    throw new DealError('Este acuerdo ha sido cancelado y ya no se puede firmar.', 410);
  }

  const now = new Date().toISOString();
  const firmado: DealData = {
    ...deal,
    estado: 'confirmado',
    nombre_firmante: signData.nombre_firmante.trim(),
    cargo_firmante: (signData.cargo_firmante || 'Programador de Sala').trim(),
    firma_imagen: signData.firma_imagen,
    firma_ip: signData.firma_ip,
    firma_user_agent: signData.firma_user_agent,
    firma_timestamp: now,
    rider_validado_por_sala: Boolean(signData.rider_validado_por_sala),
    updated_at: now
  };
  firmado.contrato_sha256 = computeDealSha256(firmado);

  // Compare-and-set: solo gana la primera firma sobre un acuerdo todavía pendiente.
  const { data: filas, error } = await tablaDeals()
    .update(firmado)
    .eq('token', deal.token)
    .eq('estado', 'pendiente')
    .select('*');
  if (error) fallo(error, 'firmar el');
  if (!filas || filas.length === 0) {
    throw new DealError('Este acuerdo ya fue firmado y no admite una nueva firma.', 409);
  }
  const updatedDeal = filas[0] as DealData;

  // --- Flywheel Step 1: Create or Ensure Concert in Tour Schedule ---
  let createdConcertId = deal.concert_id || `cnc_deal_${Date.now()}`;
  try {
    const canonicalBandId = await ensureRegisteredBandExists(deal.band_id);
    const targetBandId = canonicalBandId || deal.band_id;

    const concertPayload = {
      id: createdConcertId,
      band_id: targetBandId,
      band_name: deal.nombre_evento.replace(/^Concierto de /, '').replace(/^Concierto en /, '') || 'Banda',
      fecha: deal.fecha_evento,
      ciudad: deal.ciudad || '',
      sala: deal.lugar_sala,
      cache: Number(deal.total_acordado ?? deal.cache_base ?? 0),
      contrato_firmado: true,
      estado_pago: 'pendiente',
      notas: `Acuerdo 1-Click firmado por ${updatedDeal.nombre_firmante} (${updatedDeal.cargo_firmante}). Hash SHA-256: ${(updatedDeal.contrato_sha256 || '').slice(0, 16)}... Horario: Llegada ${deal.hora_llegada || '18:30'} / Show ${deal.hora_concierto || '21:30'}. Hospitalidad: ${deal.hospitalidad_notas || 'Estándar'}.`,
      tipo: 'sala'
    };

    let savedConcert: any = null;
    try {
      savedConcert = await dbUpsertConcert(concertPayload, targetBandId);
    } catch (upsertErr) {
      // El contrato YA está firmado y guardado; si el bolo no entra en la agenda, la
      // auto-sanación de GET /deals lo crea en la siguiente carga.
      console.warn('[dbSignDeal] dbUpsertConcert error en Supabase:', upsertErr);
      savedConcert = concertPayload;
    }

    if (savedConcert?.id) {
      createdConcertId = savedConcert.id;
      updatedDeal.concert_id = createdConcertId;
      const { error: linkErr } = await tablaDeals()
        .update({ concert_id: createdConcertId })
        .eq('token', deal.token);
      if (linkErr) console.warn('[dbSignDeal] No se pudo enlazar concert_id:', linkErr.message);
    }

    // Actualizar state.concerts en memoria y en disco local para sincronización inmediata
    try {
      const state = loadState();
      if (state && Array.isArray(state.concerts)) {
        const itemToSave = savedConcert || concertPayload;
        const idx = state.concerts.findIndex((c: any) => c.id === createdConcertId || (c.fecha === deal.fecha_evento && c.sala === deal.lugar_sala));
        if (idx !== -1) {
          state.concerts[idx] = itemToSave as any;
        } else {
          state.concerts.push(itemToSave as any);
        }
        saveState(state);
      }
    } catch (stErr) {
      console.warn('[dbSignDeal] Aviso al guardar en state.concerts:', stErr);
    }

    invalidateBandStateCache(deal.band_id);
    invalidateBandStateCache(targetBandId);
  } catch (concertErr) {
    console.warn('[dbSignDeal] Aviso al crear concierto en agenda:', concertErr);
  }

  // --- Flywheel Step 2: Update Lead in CRM to 'confirmado' ---
  if (deal.lead_id) {
    try {
      const existingLead = await dbGetLeadById(deal.lead_id, deal.band_id);
      if (existingLead) {
        await dbUpsertLead(
          {
            ...existingLead,
            estado: 'confirmado',
            notas: `${existingLead.notas || ''}\n[${now.slice(0, 10)}] Acuerdo 1-Click firmado por ${updatedDeal.nombre_firmante}. Concierto confirmado para el ${deal.fecha_evento}.`.trim()
          },
          deal.band_id
        );
      }
    } catch (leadErr) {
      console.warn('[dbSignDeal] Aviso al actualizar lead en CRM:', leadErr);
    }
  }

  return { deal: updatedDeal, concertId: createdConcertId };
}
