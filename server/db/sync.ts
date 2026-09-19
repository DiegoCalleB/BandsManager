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

const bandStateCache = new Map<string, { timestamp: number; result: any }>();
const BAND_CACHE_TTL_MS = 10_000; // 10s TTL cache for fast reads

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
    epkConfig: epkConfig || (cleanId === 'bakandeya' ? {
      biografia: "Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.",
      logoUrl: "/logo_bakandeya.jpg",
      bandPhotos: ["/logo_bakandeya.jpg"],
      riderTecnico: "- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 3 Micrófonos dinámicos vocal (Shure SM58)\n- Miking completo para sección de metales (2 x SM57 / clip condenser)\n- 2 Cajas de inyección DI para teclados/secuencias\n- Microfonía para batería estándar (Kick, Snare, 2 Toms, Overheads)",
      enlacesRedes: {
        spotify: "https://open.spotify.com/artist/bakandeya",
        youtube: "https://youtube.com/@bakandeya_oficial",
        instagram: "https://instagram.com/bakandeya_oficial",
        tiktok: "https://tiktok.com/@bakandeya_oficial",
        appleMusic: "https://music.apple.com/artist/bakandeya",
        bandcamp: "https://bakandeya.bandcamp.com",
        website: "https://bandmanager.io",
        whatsapp: "+34612345678",
        facebook: "https://facebook.com/bakandeyaoficial",
        twitter: "https://x.com/bakandeya_band"
      },
      contactoBooking: {
        nombre: "Booking & Management",
        email: "",
        telefono: ""
      },
      firmaEmail: {
        nombreRemitente: "Booking & Management",
        cargo: "Booking & Management",
        telefono: "",
        email: "",
        textoPie: "Música en directo y conciertos",
        incluirIconosRedes: true,
        adjuntarDossierPorDefecto: true,
        redesSociales: {
          spotify: "https://open.spotify.com/artist/bakandeya",
          youtube: "https://youtube.com/@bakandeya_oficial",
          instagram: "https://instagram.com/bakandeya_oficial",
          tiktok: "https://tiktok.com/@bakandeya_oficial",
          appleMusic: "https://music.apple.com/artist/bakandeya",
          bandcamp: "https://bakandeya.bandcamp.com",
          website: "https://bandmanager.io",
          whatsapp: "+34612345678"
        }
      },
      temasDestacadosIds: ["s-1", "s-2", "s-3"],
      incentivoFans: {
        mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de Bakandeya! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
        enlaceDescarga: "https://bandmanager.io/descargas/tema-inedito-directo.mp3",
        codigoDescuento: "BAKANDEYA-FAN-10"
      },
      ciudadesConfig: ["Madrid", "Sevilla", "Barcelona", "Málaga", "Valencia", "Granada", "Cádiz"]
    } : {
      biografia: "",
      logoUrl: "",
      bandPhotos: [],
      riderTecnico: "",
      enlacesRedes: {},
      contactoBooking: {},
      temasDestacadosIds: [],
      incentivoFans: {},
      ciudadesConfig: []
    }),
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

