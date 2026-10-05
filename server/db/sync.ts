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

const bandStateCache = new Map<string, { timestamp: number; result: any }>();
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
    } catch (_) {}
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
export function bandasDeLaPeticion(req: { headers?: any; user?: any }): string[] {
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
  return (req: any, res: any, next: () => void) => {
    const metodo = String(req?.method || '').toUpperCase();
    if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return next();
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      try {
        for (const id of bandasDeLaPeticion(req)) invalidar(id);
      } catch (_) {
        /* una caché no invalidada nunca debe romper una respuesta ya enviada */
      }
    });
    next();
  };
}

export async function loadStateFromSupabase(bandId: string, user?: any) {
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
        uBands.forEach((ub: any) => {
          if (ub.band_id) {
            const cb = cleanBandId(ub.band_id);
            if (cb && cb !== '__sin_banda__') userBandIds.add(cb);
          }
        });
      }
    } catch (_) {}
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
    dbGetLeads(cleanId).catch(() => []),
    dbGetRehearsals(eventsBandParam).catch(() => []),
    dbGetConcerts(eventsBandParam).catch(() => []),
    dbGetSongs(cleanId).catch(() => []),
    dbGetSetlists(cleanId).catch(() => []),
    dbGetEpkConfig(cleanId).catch(() => null),
    dbGetAutonomyConfig(cleanId).catch(() => null),
    dbGetFans(cleanId).catch(() => []),
    dbGetSocialPosts(cleanId).catch(() => []),
    dbGetPayments(cleanId).catch(() => []),
    dbGetSocialMetrics(cleanId).catch(() => []),
    dbGetTours(cleanId).catch(() => []),
    dbGetRunOfShow(cleanId).catch(() => ({})),
    dbGetGearChecklists(cleanId).catch(() => ({})),
    dbGetRegisteredBands().catch(() => []),
    dbGetUsers(cleanId).catch(() => []),
    dbGetBandContacts(cleanId).catch(() => []),
    dbGetCampaigns(cleanId).catch(() => []),
    dbGetCategoryTemplates(cleanId).catch(() => ({}))
  ]);

  // Strict tenant scoping and validation layer
  const activeBandSet = new Set([cleanId, cleanId.startsWith('band-') ? cleanId.replace(/^band-/, '') : `band-${cleanId}`]);
  const permittedBandsSet = new Set(allRelevantBandIds.flatMap(id => [id, id.startsWith('band-') ? id.replace(/^band-/, '') : `band-${id}`]));

  // Calendar events: visible for all bands the user is permitted to see
  const validatedConcerts = (concerts || []).filter((c: any) => c.band_id && permittedBandsSet.has(cleanBandId(c.band_id)));
  const validatedRehearsals = (rehearsals || []).filter((r: any) => r.band_id && permittedBandsSet.has(cleanBandId(r.band_id)));

  // All other modules: strictly scoped to the active band
  const validatedLeads = (leads || []).filter((l: any) => l.band_id && activeBandSet.has(cleanBandId(l.band_id)));
  const validatedSongs = (songs || []).filter((s: any) => s.band_id && activeBandSet.has(cleanBandId(s.band_id)));
  const validatedSetlists = (setlists || []).filter((s: any) => s.band_id && activeBandSet.has(cleanBandId(s.band_id)));
  const validatedPosts = (posts || []).filter((p: any) => p.band_id && activeBandSet.has(cleanBandId(p.band_id)));
  const validatedPayments = (payments || []).filter((p: any) => p.band_id && activeBandSet.has(cleanBandId(p.band_id)));
  const validatedTours = (tours || []).filter((t: any) => t.band_id && activeBandSet.has(cleanBandId(t.band_id)));
  const validatedFans = (fans || []).filter((f: any) => f.band_id && activeBandSet.has(cleanBandId(f.band_id)));
  const validatedBands = (bands || []).filter((b: any) => b.band_id && activeBandSet.has(cleanBandId(b.band_id)));
  const validatedCampaigns = (campaigns || []).filter((c: any) => c.band_id && activeBandSet.has(cleanBandId(c.band_id)));

  // Strict tenant scoping: never leak other bands' registered info to unauthorized users
  const filteredRegisteredBands = (registeredBands || []).filter((b: any) => {
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

// ----------------------------------------------------
// BAND SCHEDULES (Smart Gate - Python agent triggers)
// ----------------------------------------------------
const inMemorySchedules: Record<string, {
  band_id: string;
  timezone: string;
  horas_lector: number[];
  horas_enviador: number[];
  dias_enviador: number[];
  dias_lector: number[];
}> = {};

