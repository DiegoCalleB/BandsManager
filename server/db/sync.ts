import { getSupabase, cleanBandId } from "./core.js";

import { dbGetRegisteredBands } from "./bands.js";
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

export async function loadStateFromSupabase(bandId: string, user?: any) {
  const cleanId = cleanBandId(bandId || "band-bakandeya");
  await ensureRegisteredBandExists(cleanId, user?.bandName || user?.band_name);

  // Determine all bands relevant to this user (for multi-band calendar view)
  const userBandIds = new Set<string>();
  userBandIds.add(cleanId);
  if (user) {
    if (user.band_id) userBandIds.add(cleanBandId(user.band_id));
    if (user.main_band_id) userBandIds.add(cleanBandId(user.main_band_id));
    if (Array.isArray(user.allowedBandIds)) {
      user.allowedBandIds.forEach((b: string) => userBandIds.add(cleanBandId(b)));
    }
  }

  // Also query userBands relations from Supabase for this user
  if (user?.id) {
    try {
      const sb = getSupabase();
      const { data: uBands } = await sb.from("user_bands").select("band_id").eq("user_id", user.id);
      if (uBands && Array.isArray(uBands)) {
        uBands.forEach((ub: any) => {
          if (ub.band_id) userBandIds.add(cleanBandId(ub.band_id));
        });
      }
    } catch (_) {}
  }

  const allRelevantBandIds = Array.from(userBandIds);

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
    bands
  ] = await Promise.all([
    dbGetLeads(cleanId).catch(() => []),
    dbGetRehearsals(allRelevantBandIds.length > 1 ? allRelevantBandIds : cleanId).catch(() => []),
    dbGetConcerts(allRelevantBandIds.length > 1 ? allRelevantBandIds : cleanId).catch(() => []),
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
    dbGetBandContacts(cleanId).catch(() => [])
  ]);

  return {
    leads,
    rehearsals,
    concerts,
    posts,
    payments,
    metrics,
    songs,
    setlists,
    bands,
    tours,
    fans,
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
        website: "https://bands-manager.up.railway.app",
        whatsapp: "+34612345678",
        facebook: "https://facebook.com/bakandeyaoficial",
        twitter: "https://x.com/bakandeya_band"
      },
      contactoBooking: {
        nombre: "Booking & Management Bakandeya",
        email: "diego.delacalleb@gmail.com",
        telefono: "+34 612 345 678"
      },
      firmaEmail: {
        nombreRemitente: "Diego de la Calle",
        cargo: "Booking & Management | Bakandeya",
        telefono: "+34 612 345 678",
        email: "diego.delacalleb@gmail.com",
        textoPie: "Bakandeya — Música en directo, mestizaje y ska-rock",
        incluirIconosRedes: true,
        adjuntarDossierPorDefecto: true,
        redesSociales: {
          spotify: "https://open.spotify.com/artist/bakandeya",
          youtube: "https://youtube.com/@bakandeya_oficial",
          instagram: "https://instagram.com/bakandeya_oficial",
          tiktok: "https://tiktok.com/@bakandeya_oficial",
          appleMusic: "https://music.apple.com/artist/bakandeya",
          bandcamp: "https://bakandeya.bandcamp.com",
          website: "https://bands-manager.up.railway.app",
          whatsapp: "+34612345678"
        }
      },
      temasDestacadosIds: ["s-1", "s-2", "s-3"],
      incentivoFans: {
        mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de Bakandeya! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
        enlaceDescarga: "https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3",
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
    registeredBands,
    users,
    categoryTemplates: []
  };
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

