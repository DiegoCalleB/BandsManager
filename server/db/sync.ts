// Carga del estado en memoria desde Supabase (`loadStateFromSupabase`) e invalidación de caché por
// banda (AGENTS.md §1).

import { getSupabase, cleanBandId } from "./core.js";

import { dbGetRegisteredBands, ensureRegisteredBandExists } from "./bands.js";
import { dbGetUsers } from "./users.js";
import { dbGetBandContacts } from "./contacts.js";
import { dbGetLeads } from "./leads.js";
import { dbGetRehearsals } from "./rehearsals.js";
import { dbGetConcerts } from "./concerts.js";
import { dbGetSongs, dbGetSetlists } from "./repertoire.js";
import { dbGetEpkConfig } from "./epk.js";
import { dbGetAutonomyConfig } from "./autonomy.js";
import { dbGetFans } from "./fans.js";
import { dbGetSocialPosts, dbGetSocialMetrics } from "./social.js";
import { dbGetPayments } from "./payments.js";
import { dbGetTours } from "./tours.js";
import { dbGetRunOfShow, dbGetGearChecklists } from "./production.js";
import { dbGetCampaigns } from "./campaigns.js";
import { dbGetCategoryTemplates } from "./categoryTemplates.js";
import { defaultEpkConfigFor } from "../seeds/demoEpk.js";
import type { UsuarioDeSesion } from "../auth.js";
import type { AutonomyConfig } from "./autonomy.js";

/** Cualquier registro que pertenece a una banda: es lo único que miran los filtros de aislamiento. */
type ConBanda = { band_id?: string };

/** Estado que se sirve a una banda (lo que devuelve `loadStateFromSupabase` y se guarda en caché). */
export interface EstadoDeBanda {
  leads: Awaited<ReturnType<typeof dbGetLeads>>;
  rehearsals: Awaited<ReturnType<typeof dbGetRehearsals>>;
  concerts: Awaited<ReturnType<typeof dbGetConcerts>>;
  posts: Awaited<ReturnType<typeof dbGetSocialPosts>>;
  payments: Awaited<ReturnType<typeof dbGetPayments>>;
  metrics: Awaited<ReturnType<typeof dbGetSocialMetrics>>;
  songs: Awaited<ReturnType<typeof dbGetSongs>>;
  setlists: Awaited<ReturnType<typeof dbGetSetlists>>;
  bands: Awaited<ReturnType<typeof dbGetBandContacts>>;
  tours: Awaited<ReturnType<typeof dbGetTours>>;
  fans: Awaited<ReturnType<typeof dbGetFans>>;
  campaigns: Awaited<ReturnType<typeof dbGetCampaigns>>;
  messages: unknown[];
  runOfShow: Awaited<ReturnType<typeof dbGetRunOfShow>>;
  gearChecklists: Awaited<ReturnType<typeof dbGetGearChecklists>>;
  epkConfig: NonNullable<Awaited<ReturnType<typeof dbGetEpkConfig>>> | ReturnType<typeof defaultEpkConfigFor>;
  autonomyConfig: AutonomyConfig | AutonomiaPorDefecto;
  registeredBands: Awaited<ReturnType<typeof dbGetRegisteredBands>>;
  users: Awaited<ReturnType<typeof dbGetUsers>>;
  categoryTemplates: Awaited<ReturnType<typeof dbGetCategoryTemplates>>;
}

/** Autonomía que se sirve cuando la banda no ha configurado nada (incluye los umbrales heredados). */
interface AutonomiaPorDefecto {
  dispatchLevel: string;
  negotiationDepth: string;
  minCacheThreshold: number;
  maxCacheThreshold: number;
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean;
}

const bandStateCache = new Map<string, { timestamp: number; result: EstadoDeBanda }>();
// TTL de caché en memoria para lecturas pasivas: 60 segundos por defecto (o BAND_CACHE_TTL_MS).
//
// Antes eran 30 minutos y el comentario aseguraba que "cualquier mutación invalida la clave", pero
// en la práctica solo lo hacían EPK, acuerdos y usuarios: guardar una sala, un concierto, una
// canción o un ensayo NO invalidaba nada, así que /api/state devolvía la ficha VIEJA hasta media
// hora después (o hasta el siguiente redeploy) y el cambio "volvía" al recargar. Ahora:
//   1. server.ts invalida la banda tras CUALQUIER escritura correcta en /api
//      (invalidarCachePorEscritura, abajo), sin tener que acordarse en cada ruta nueva;
//   2. el TTL corto acota lo que no pasa por HTTP (agentes, cron, webhooks).
const BAND_CACHE_TTL_MS = Number(process.env.BAND_CACHE_TTL_MS) || 60 * 1000;

export function invalidateBandStateCache(bandId?: string) {
  if (bandId) {
    try {
      const cleanId = cleanBandId(bandId);
      for (const key of bandStateCache.keys()) {
        if (key.startsWith(`${cleanId}:`)) {
          bandStateCache.delete(key);
        }
      }
    } catch { /* id de banda no normalizable: no hay entradas de caché que invalidar */ }
  } else {
    bandStateCache.clear();
  }
}

/** Todas las formas en que puede aparecer el id de una banda (band-x, reg-x, x) para invalidar sin fallos. */
function variantesDeBanda(id: string): string[] {
  const limpio = String(id || '').trim();
  if (!limpio) return [];
  const base = limpio.replace(/^(band|reg)-/, '');
  return Array.from(new Set([limpio, base, `band-${base}`, `reg-${base}`]));
}

/** Bandas implicadas en una petición: la de la sesión y la que pida la cabecera x-band-id. */
export function bandasDeLaPeticion(req: {
  headers?: Record<string, string | string[] | undefined>;
  user?: { band_id?: string };
}): string[] {
  const ids = new Set<string>();
  const sesion = req?.user?.band_id;
  if (typeof sesion === 'string') variantesDeBanda(sesion).forEach((v) => ids.add(v));
  const cabecera = req?.headers?.['x-band-id'];
  if (typeof cabecera === 'string') variantesDeBanda(cabecera).forEach((v) => ids.add(v));
  return Array.from(ids);
}

/**
 * Middleware: tras cualquier escritura (POST/PUT/PATCH/DELETE) que termine bien, invalida la caché
 * de estado de la banda afectada. Se monta una vez en server.ts, así una ruta nueva no depende de
 * que alguien se acuerde de llamar a invalidateBandStateCache(). `invalidar` es inyectable para tests.
 */
export function invalidarCachePorEscritura(invalidar: (bandId: string) => void = invalidateBandStateCache) {
  return (
    req: { method?: string; headers?: Record<string, string | string[] | undefined>; user?: { band_id?: string } },
    res: { statusCode: number; on(evento: 'finish', callback: () => void): unknown },
    next: () => void,
  ) => {
    const metodo = String(req?.method || '').toUpperCase();
    if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return next();
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      try {
        for (const id of bandasDeLaPeticion(req)) invalidar(id);
      } catch {
        /* una caché no invalidada nunca debe romper una respuesta ya enviada */
      }
    });
    next();
  };
}

/** Usuario de la sesión con los alias heredados de banda que aún traen algunas cuentas. */
type UsuarioDelEstado = UsuarioDeSesion & { id?: string; main_band_id?: string; band_name?: string };

/**
 * Valor de respaldo si una lectura falla, con el tipo de la propia lectura (un `[]` suelto se
 * ensancharía a `any[]` y la lectura tipada perdería su tipo).
 */
const conRespaldo = <T>(lectura: Promise<T>, respaldo: T): Promise<T> => lectura.catch(() => respaldo);

/** Filtro de aislamiento: deja solo los registros de las bandas indicadas. */
const perteneceA = (bandas: Set<string>) => (registro: ConBanda) =>
  Boolean(registro.band_id) && bandas.has(cleanBandId(registro.band_id));

export async function loadStateFromSupabase(bandId: string, user?: UsuarioDelEstado): Promise<EstadoDeBanda> {
  const cleanId = cleanBandId(bandId);
  const cacheKey = `${cleanId}:${user?.id || 'anonymous'}`;
  const cached = bandStateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < BAND_CACHE_TTL_MS) {
    return cached.result;
  }

  await ensureRegisteredBandExists(cleanId, user?.bandName || user?.band_name);

  // Determine all bands relevant to this user (strictly authorized bands only)
  const userBandIds = new Set<string>();
  if (cleanId && cleanId !== '__sin_banda__') {
    userBandIds.add(cleanId);
  }
  if (user) {
    if (user.band_id) userBandIds.add(cleanBandId(user.band_id));
    if (user.main_band_id) userBandIds.add(cleanBandId(user.main_band_id));
    if (Array.isArray(user.allowedBandIds)) {
      user.allowedBandIds.forEach((b: string) => {
        const cb = cleanBandId(b);
        if (cb && cb !== '__sin_banda__') userBandIds.add(cb);
      });
    }
  }

  // Also query userBands relations from Supabase for this specific user ID
  if (user?.id) {
    try {
      const sb = getSupabase();
      const { data: uBands } = await sb.from("user_bands").select("band_id").eq("user_id", user.id);
      if (uBands && Array.isArray(uBands)) {
        uBands.forEach((ub) => {
          if (ub.band_id) {
            const cb = cleanBandId(ub.band_id);
            if (cb && cb !== '__sin_banda__') userBandIds.add(cb);
          }
        });
      }
    } catch (err) { console.warn("[Sync] Fallo leyendo user_bands; el usuario ve solo sus bandas en memoria:", err); }
  }

  const allRelevantBandIds = Array.from(userBandIds);
  const eventsBandParam = allRelevantBandIds.length > 1 ? allRelevantBandIds : cleanId;

  const [
    leads,
    rehearsals,
    concerts,
    songs,
    setlists,
    epkConfig,
    autonomyConfig,
    fans,
    posts,
    payments,
    metrics,
    tours,
    runOfShow,
    gearChecklists,
    registeredBands,
    users,
    bands,
    campaigns,
    categoryTemplates
  ] = await Promise.all([
    conRespaldo(dbGetLeads(cleanId), []),
    conRespaldo(dbGetRehearsals(eventsBandParam), []),
    conRespaldo(dbGetConcerts(eventsBandParam), []),
    conRespaldo(dbGetSongs(cleanId), []),
    conRespaldo(dbGetSetlists(cleanId), []),
    conRespaldo(dbGetEpkConfig(cleanId), null),
    conRespaldo(dbGetAutonomyConfig(cleanId), null),
    conRespaldo(dbGetFans(cleanId), []),
    conRespaldo(dbGetSocialPosts(cleanId), []),
    conRespaldo(dbGetPayments(cleanId), []),
    conRespaldo(dbGetSocialMetrics(cleanId), []),
    conRespaldo(dbGetTours(cleanId), []),
    dbGetRunOfShow(cleanId).catch(() => ({})),
    dbGetGearChecklists(cleanId).catch(() => ({})),
    conRespaldo(dbGetRegisteredBands(), []),
    conRespaldo(dbGetUsers(cleanId), []),
    conRespaldo(dbGetBandContacts(cleanId), []),
    conRespaldo(dbGetCampaigns(cleanId), []),
    dbGetCategoryTemplates(cleanId).catch(() => ({}))
  ]);

  // Strict tenant scoping and validation layer
  const activeBandSet = new Set([cleanId, cleanId.startsWith('band-') ? cleanId.replace(/^band-/, '') : `band-${cleanId}`]);
  const permittedBandsSet = new Set(allRelevantBandIds.flatMap(id => [id, id.startsWith('band-') ? id.replace(/^band-/, '') : `band-${id}`]));

  // Calendar events: visible for all bands the user is permitted to see
  const validatedConcerts = (concerts || []).filter(perteneceA(permittedBandsSet));
  const validatedRehearsals = (rehearsals || []).filter(perteneceA(permittedBandsSet));

  // All other modules: strictly scoped to the active band
  const validatedLeads = (leads || []).filter(perteneceA(activeBandSet));
  const validatedSongs = (songs || []).filter(perteneceA(activeBandSet));
  const validatedSetlists = (setlists || []).filter(perteneceA(activeBandSet));
  const validatedPosts = (posts || []).filter(perteneceA(activeBandSet));
  const validatedPayments = (payments || []).filter(perteneceA(activeBandSet));
  const validatedTours = (tours || []).filter(perteneceA(activeBandSet));
  const validatedFans = (fans || []).filter(perteneceA(activeBandSet));
  const validatedBands = (bands || []).filter(perteneceA(activeBandSet));
  const validatedCampaigns = (campaigns || []).filter(perteneceA(activeBandSet));

  // Strict tenant scoping: never leak other bands' registered info to unauthorized users
  const filteredRegisteredBands = (registeredBands || []).filter((b: ConBanda & { id?: string }) => {
    const rawBandId = b.band_id ? b.band_id : (b.id ?? '');
    const bId = cleanBandId(rawBandId);
    return allRelevantBandIds.includes(bId);
  });

  const resState = {
    leads: validatedLeads,
    rehearsals: validatedRehearsals,
    concerts: validatedConcerts,
    posts: validatedPosts,
    payments: validatedPayments,
    metrics,
    songs: validatedSongs,
    setlists: validatedSetlists,
    bands: validatedBands,
    tours: validatedTours,
    fans: validatedFans,
    campaigns: validatedCampaigns,
    messages: [],
    runOfShow,
    gearChecklists,
    epkConfig: epkConfig || defaultEpkConfigFor(cleanId),
    autonomyConfig: autonomyConfig || {
      dispatchLevel: "draft_only",
      negotiationDepth: "filter_conditions",
      minCacheThreshold: 300,
      maxCacheThreshold: 800,
      autoDeclineUnderMinCache: false,
      notifyOnEveryProposal: true,
      requireHumanForFinalSignOff: true
    },
    registeredBands: filteredRegisteredBands,
    users,
    categoryTemplates
  };

  bandStateCache.set(cacheKey, { timestamp: Date.now(), result: resState });
  return resState;
}

