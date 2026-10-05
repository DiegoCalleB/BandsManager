import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabase, cleanBandId } from './core.js';
import { ensureRegisteredBandExists } from './bands.js';
import { dbUpsertConcert, dbGetConcerts } from './concerts.js';
import { dbUpsertLead, dbGetLeadById } from './leads.js';
import { invalidateBandStateCache } from './sync.js';
import { loadState, saveState } from '../state.js';

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

const DEALS_FILE = path.join(process.cwd(), 'deals_storage.json');

function loadPersistentDeals(): Map<string, DealData> {
  const map = new Map<string, DealData>();
  try {
    if (fs.existsSync(DEALS_FILE)) {
      const raw = fs.readFileSync(DEALS_FILE, 'utf8');
      if (raw.trim()) {
        const arr: DealData[] = JSON.parse(raw);
        arr.forEach(d => {
          if (d.token) map.set(d.token, d);
        });
      }
    }
  } catch (err) {
    console.warn('[deals] Error al cargar deals_storage.json:', err);
  }
  return map;
}

// In-memory & disk-backed fallback map for absolute resilience across restarts
const memoryDeals = loadPersistentDeals();

function savePersistentDeals() {
  try {
    const arr = Array.from(memoryDeals.values());
    fs.writeFileSync(DEALS_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.warn('[deals] Error al guardar deals_storage.json:', err);
  }
}

/**
 * Generates a cryptographic canonical SHA-256 hash for the agreement content.
 * Guarantees tamper-evidence and eIDAS simple electronic signature traceability.
 */
export function computeDealSha256(deal: DealData): string {
  const canonicalString = [
    `band:${deal.band_id}`,
    `lead:${deal.lead_id || 'none'}`,
    `sala:${(deal.lugar_sala || '').trim().toLowerCase()}`,
    `fecha:${deal.fecha_evento}`,
    `total:${Number(deal.total_acordado ?? deal.cache_base ?? 0).toFixed(2)}`,
    `pago:${deal.forma_pago || 'efectivo'}`,
    `llegada:${deal.hora_llegada || '18:30'}`,
    `show:${deal.hora_concierto || '21:30'}`,
    `rider:${Boolean(deal.rider_incluido)}`
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

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('concert_deals')
      .select('*')
      .eq('band_id', cleanId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    // If Supabase table does not exist or network fails, fallback to in-memory store
  }

  // Fallback to memory
  return Array.from(memoryDeals.values()).filter(
    (d) => cleanBandId(d.band_id) === cleanId
  );
}

/**
 * Gets a single deal by its unique public token.
 */
export async function dbGetDealByToken(token: string): Promise<DealData | null> {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.trim();

  // 1. Búsqueda directa o case-insensitive en memoria persistida
  let found = memoryDeals.get(cleanToken);
  if (!found) {
    const lower = cleanToken.toLowerCase();
    for (const [t, d] of memoryDeals.entries()) {
      if (t.toLowerCase() === lower) {
        found = d;
        break;
      }
    }
  }
  if (found) return found;

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('concert_deals')
      .select('*')
      .eq('token', cleanToken)
      .maybeSingle();

    if (!error && data) {
      const dealItem = data as DealData;
      memoryDeals.set(dealItem.token || cleanToken, dealItem);
      savePersistentDeals();
      return dealItem;
    }
  } catch (err) {
    // Fallback to memory
  }

  return null;
}

/**
 * Gets the active deal associated with a lead.
 */
export async function dbGetDealByLeadId(leadId: string, bandId: string): Promise<DealData | null> {
  const cleanId = cleanBandId(bandId);
  if (!cleanId || !leadId) return null;

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('concert_deals')
      .select('*')
      .eq('band_id', cleanId)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as DealData;
    }
  } catch (err) {
    // Fallback to memory
  }

  for (const deal of memoryDeals.values()) {
    if (cleanBandId(deal.band_id) === cleanId && deal.lead_id === leadId) {
      return deal;
    }
  }
  return null;
}

/**
 * Upserts a deal from the band dashboard.
 */
export async function dbUpsertDeal(
  deal: Partial<DealData> & { band_id: string; lugar_sala: string; fecha_evento: string },
  bandId: string
): Promise<DealData> {
  const targetBandId = cleanBandId(bandId);
  if (!targetBandId || targetBandId === '__sin_banda__') {
    throw new Error('ID de banda inválido para persistir el acuerdo');
  }

  const id = deal.id || `deal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const token = deal.token || generateDealToken();

  const cacheBase = Number(deal.cache_base ?? 0);
  const totalAcordado = Number(deal.total_acordado ?? cacheBase);

  const payload: DealData = {
    id,
    band_id: targetBandId,
    lead_id: deal.lead_id || null,
    concert_id: deal.concert_id || null,
    token,
    nombre_evento: deal.nombre_evento || `Concierto en ${deal.lugar_sala}`,
    lugar_sala: deal.lugar_sala,
    ciudad: deal.ciudad || '',
    fecha_evento: deal.fecha_evento,
    hora_llegada: deal.hora_llegada || '18:30',
    hora_concierto: deal.hora_concierto || '21:30',
    tipo_remuneracion: deal.tipo_remuneracion || 'cache_fijo',
    cache_base: cacheBase,
    total_acordado: totalAcordado,
    forma_pago: deal.forma_pago || 'efectivo',
    rider_incluido: deal.rider_incluido ?? true,
    rider_texto: deal.rider_texto || '',
    rider_validado_por_sala: Boolean(deal.rider_validado_por_sala),
    hospitalidad_notas: deal.hospitalidad_notas || '',
    estado: deal.estado || 'pendiente',
    nombre_firmante: deal.nombre_firmante || undefined,
    cargo_firmante: deal.cargo_firmante || undefined,
    firma_imagen: deal.firma_imagen || undefined,
    firma_ip: deal.firma_ip || undefined,
    firma_user_agent: deal.firma_user_agent || undefined,
    firma_timestamp: deal.firma_timestamp || undefined,
    contrato_sha256: deal.contrato_sha256 || undefined,
    created_at: deal.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Always store in memory fallback and disk
  memoryDeals.set(payload.token!, payload);
  savePersistentDeals();

  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('concert_deals')
      .upsert(payload, { onConflict: 'token' })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return data as DealData;
    }
  } catch (err) {
    // If table not yet migrated, memory fallback keeps the app running
  }

  return payload;
}

/**
 * Signs a deal from the public link (/deal/:token).
 * Calculates the immutable SHA-256 seal, updates status to 'confirmado',
 * and triggers the automatic flywheel:
 * 1. Updates the associated lead to 'confirmado'
 * 2. Creates the event in the band's concert tour schedule (concerts)
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
    throw new Error('Acuerdo no encontrado o token inválido');
  }

  const now = new Date().toISOString();
  const sha256 = computeDealSha256(deal);

  const updatedDeal: DealData = {
    ...deal,
    estado: 'confirmado',
    nombre_firmante: signData.nombre_firmante.trim(),
    cargo_firmante: (signData.cargo_firmante || 'Programador de Sala').trim(),
    firma_imagen: signData.firma_imagen,
    firma_ip: signData.firma_ip,
    firma_user_agent: signData.firma_user_agent,
    firma_timestamp: deal.firma_timestamp || now,
    contrato_sha256: deal.contrato_sha256 || sha256,
    rider_validado_por_sala: Boolean(signData.rider_validado_por_sala),
    updated_at: now
  };

  // Guardar en memoria local inmediata y disco
  memoryDeals.set(token, updatedDeal);
  savePersistentDeals();

  const sb = getSupabase();
  try {
    await sb
      .from('concert_deals')
      .update(updatedDeal)
      .eq('token', token);
  } catch (err) {
    // Continue with flywheel
  }

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
      estado_pago: deal.forma_pago === 'efectivo' ? 'pendiente' : 'pendiente',
      notas: `Acuerdo 1-Click firmado por ${updatedDeal.nombre_firmante} (${updatedDeal.cargo_firmante}). Hash SHA-256: ${(updatedDeal.contrato_sha256 || sha256).slice(0, 16)}... Horario: Llegada ${deal.hora_llegada || '18:30'} / Show ${deal.hora_concierto || '21:30'}. Hospitalidad: ${deal.hospitalidad_notas || 'Estándar'}.`,
      tipo: 'sala'
    };

    let savedConcert: any = null;
    try {
      savedConcert = await dbUpsertConcert(concertPayload, targetBandId);
    } catch (upsertErr) {
      console.warn('[dbSignDeal] dbUpsertConcert error en Supabase, usando payload:', upsertErr);
      savedConcert = concertPayload;
    }

    if (savedConcert?.id) {
      createdConcertId = savedConcert.id;
      updatedDeal.concert_id = createdConcertId;
      memoryDeals.set(token, updatedDeal);
      try {
        await sb.from('concert_deals').update({ concert_id: createdConcertId }).eq('token', token);
      } catch (_) {}
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

    // Invalidar inmediatamente la caché de estado de la banda
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
