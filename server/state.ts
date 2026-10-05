import fs from "fs";
import path from "path";
import express from "express";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES, INITIAL_SOCIAL_METRICS, INITIAL_USERS, INITIAL_SONGS, INITIAL_SETLISTS, INITIAL_BANDS, INITIAL_TOURS } from "../src/db_seed.js";
import {
  HERDEIROS_BAND_ID,
  MASTER_OF_PROMPTS_BAND_ID,
  HERDEIROS_LEADS,
  HERDEIROS_BANDS,
  HERDEIROS_SONGS,
  HERDEIROS_SETLISTS,
  HERDEIROS_CONCERTS,
  HERDEIROS_REHEARSALS,
  HERDEIROS_TOURS,
  HERDEIROS_PAYMENTS,
  HERDEIROS_FANS,
  HERDEIROS_POSTS,
  HERDEIROS_METRICS,
  HERDEIROS_EPK_CONFIG,
  MOP_LEADS,
  MOP_BANDS,
  MOP_SONGS,
  MOP_SETLISTS,
  MOP_CONCERTS,
  MOP_REHEARSALS,
  MOP_TOURS,
  MOP_PAYMENTS,
  MOP_FANS,
  MOP_POSTS,
  MOP_METRICS,
  MASTER_OF_PROMPTS_EPK_CONFIG
} from "../src/data/mouredevBandsSeed.js";
import { ACTIVE_SESSIONS, hashPassword, getUserFromRequest, createAuthMiddleware, createLeaderMiddleware, createCronOrAuthMiddleware } from "./auth.js";
import { generateUniqueSlugId, slugify } from "./utils/slug.js";
import { ensureCategoryTemplatesInState } from "./promptsManager.js";

const DATA_FILE = path.join(process.cwd(), "data.json");

const INITIAL_RUN_OF_SHOW: Record<string, any[]> = {
  '2026-07-23': [
    { id: 'ros-1', time: '17:00', activity: 'Llegada a la sala y descarga de bártulos', done: true },
    { id: 'ros-2', time: '17:30', activity: 'Montaje de escenario e in-ears', done: true },
    { id: 'ros-3', time: '18:15', activity: 'Prueba de sonido (Soundcheck de violín, sintes y bases)', done: true },
    { id: 'ros-4', time: '19:30', activity: 'Cena de la banda / Catering', done: false },
    { id: 'ros-5', time: '21:00', activity: 'Apertura de puertas', done: false },
    { id: 'ros-6', time: '21:30', activity: 'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎻💥', done: false },
    { id: 'ros-7', time: '23:30', activity: 'Merchandising, firmas y recogida de equipo', done: false },
  ],
  '2026-07-15': [
    { id: 'ros-10', time: '17:00', activity: 'Camerinos Rock Palace - Montaje y chequeo', done: true },
    { id: 'ros-11', time: '18:00', activity: 'Prueba de loops con Jon y violín', done: true },
    { id: 'ros-12', time: '20:30', activity: 'Cierre del ensayo y notas generales', done: false },
  ]
};

const INITIAL_GEAR_CHECKLISTS: Record<string, any[]> = {
  '2026-07-23': [
    { id: 'gear-1', label: 'Teclado Korg SV-2 + Stand', checked: true },
    { id: 'gear-2', label: 'Estuche Violín electroacústico + Arco y resina', checked: true },
    { id: 'gear-3', label: 'Banderola de Escenario Bakandeya', checked: false },
    { id: 'gear-4', label: 'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
    { id: 'gear-5', label: 'Cables Jack / XLR de recambio', checked: true },
    { id: 'gear-6', label: 'DI-Box estéreo para teclados', checked: false },
  ]
};

const DEFAULT_EPK_CONFIG = {
  biografia: "Bakandeya es una propuesta vibrante de mestizaje, balkan-ska, reggae y electrónica analógica liderada por violín solista, sintetizadores, percusión en vivo, bajo y voz. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.",
  logoUrl: "/logo_bakandeya.jpg",
  bandPhotos: [
    "/logo_bakandeya.jpg"
  ],
  riderTecnico: "- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 2 Micrófonos dinámicos vocal (Shure SM58)\n- Líneas de inyección DI para violín solista y sintetizadores analógicos/secuencias\n- Microfonía para percusión y batería estándar en vivo (Kick, Snare, 2 Toms, Overheads)\n- 1 Línea DI para bajo eléctrico",
  enlacesRedes: {
    spotify: "",
    youtube: "https://youtube.com/@bakandeya_oficial",
    instagram: "https://instagram.com/bakandeya_oficial",
    tiktok: "https://tiktok.com/@bakandeya_oficial",
    appleMusic: "",
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
  temasDestacadosIds: ["s-1", "s-2", "s-3"],
  incentivoFans: {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a nuestra comunidad! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
    enlaceDescarga: "https://bandmanager.io/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "FAN-10"
  },
  donacionRevolut: {
    habilitado: true,
    revolutTag: "",
    revolutUrl: "",
    titulo: "Colabora con la banda con una aportación económica",
    descripcion: "Tu apoyo directo y voluntario nos permite financiar gastos de furgoneta de gira, grabación de nuevos sencillos en estudio y material independiente sin intermediarios."
  },
  ciudadesConfig: ["Madrid", "Sevilla", "Barcelona", "Málaga", "Valencia", "Granada", "Cádiz"],
  firmaEmail: {
    nombreRemitente: "Booking & Management",
    cargo: "Booking & Management",
    telefono: "",
    email: "",
    textoPie: "Música en directo y conciertos",
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: "",
      youtube: "https://youtube.com/@bakandeya_oficial",
      instagram: "https://instagram.com/bakandeya_oficial",
      tiktok: "https://tiktok.com/@bakandeya_oficial",
      appleMusic: "",
      bandcamp: "https://bakandeya.bandcamp.com",
      website: "https://bandmanager.io",
      whatsapp: "+34612345678"
    }
  }
};

export const DEFAULT_AUTONOMY_CONFIG = {
  dispatchLevel: 'draft_only',
  negotiationDepth: 'filter_conditions',
  minCacheThreshold: 300,
  maxCacheThreshold: 800,
  autoDeclineUnderMinCache: false,
  notifyOnEveryProposal: true,
  requireHumanForFinalSignOff: true,
  dispatchMode: 'draft_gmail'
};

const INITIAL_FANS = [
  {
    id: "fan-1",
    nombre: "Laura Giménez",
    email: "laura.gimenez@gmail.com",
    ciudad: "Madrid",
    comoConocio: "Concierto Sala Caracol",
    conciertoOrigenId: "cnc-1",
    conciertoOrigenNombre: "Sala Caracol (Madrid)",
    fechaCaptura: "2026-03-15",
    consentimientoRGPD: true
  },
  {
    id: "fan-2",
    nombre: "Carlos Ruiz",
    email: "cruiz.ska@hotmail.com",
    ciudad: "Valencia",
    comoConocio: "Festival ViñaRock",
    conciertoOrigenId: "cnc-2",
    conciertoOrigenNombre: "16 Toneladas (Valencia)",
    fechaCaptura: "2026-04-02",
    consentimientoRGPD: true
  },
  {
    id: "fan-3",
    nombre: "Elena Morales",
    email: "elena.morales.sevilla@gmail.com",
    ciudad: "Sevilla",
    comoConocio: "Concierto Sala Malandar",
    conciertoOrigenId: "cnc-3",
    conciertoOrigenNombre: "Sala Malandar (Sevilla)",
    fechaCaptura: "2026-04-18",
    consentimientoRGPD: true
  },
  {
    id: "fan-4",
    nombre: "Marc Soler",
    email: "marc.soler.bcn@gmail.com",
    ciudad: "Barcelona",
    comoConocio: "Directo Sala Apolo",
    conciertoOrigenId: "lead-1",
    conciertoOrigenNombre: "Sala Apolo (Barcelona)",
    fechaCaptura: "2026-05-02",
    consentimientoRGPD: true
  },
  {
    id: "fan-5",
    nombre: "Sara Navarro",
    email: "sara.navarro.ska@gmail.com",
    ciudad: "Granada",
    comoConocio: "Sala El Tren",
    conciertoOrigenId: "lead-3",
    conciertoOrigenNombre: "Sala El Tren (Granada)",
    fechaCaptura: "2026-05-10",
    consentimientoRGPD: true
  }
];

export const BAKANDEYA_BAND_ID = "band-bakandeya";

export const BAKANDEYA_REGISTERED_BAND = {
  id: "reg-bakandeya",
  band_id: BAKANDEYA_BAND_ID,
  user_id: "user-diego",
  fecha_registro: "2026-01-01T10:00:00.000Z",
  nombre_banda: "Bakandeya",
  email: "diego.delacalleb@gmail.com",
  plan: "pro",
  contacto_nombre: "Diego de la Calle",
  estilo_musical: "Mestizaje / Ska-Rock / Reggae / Electrónica",
  localizacion: "Madrid / Sevilla (España)",
  telefono: "+34 612 345 678",
  instagram: "@bakandeya_oficial",
  spotify_youtube: "https://open.spotify.com/artist/bakandeya",
  aforo_promedio: 500,
  estado_cuenta: "activo",
  notas: "Banda oficial de la plataforma Bakandeya"
};

const VERTICE_REGISTERED_BAND = {
  id: "reg-vertice",
  band_id: "band-vertice",
  user_id: "user-admin",
  nombre_banda: "Vértice",
  email: "diego.delacalleb@gmail.com",
  plan: "cabeza_de_cartel",
  contacto_nombre: "Diego",
  estado_cuenta: "activo",
  notas: "Banda principal asignada a usuario Admin"
};

export { MASTER_OF_PROMPTS_BAND_ID, HERDEIROS_BAND_ID, MASTER_OF_PROMPTS_EPK_CONFIG };

export const MASTER_OF_PROMPTS_REGISTERED_BAND = {
  id: "reg-master-of-prompts",
  band_id: MASTER_OF_PROMPTS_BAND_ID,
  user_id: "user-mouredev",
  fecha_registro: "2026-01-01T10:00:00.000Z",
  nombre_banda: "Master of Prompts",
  email: "mouredev@gmail.com",
  plan: "cabeza_de_cartel",
  contacto_nombre: "Brais Moure",
  estilo_musical: "Thrash Metal Galaico / Heavy Dev / AI Metal",
  localizacion: "A Coruña (Galicia, España)",
  telefono: "+34 688 101 010",
  instagram: "@mouredev",
  spotify_youtube: "https://youtube.com/@mouredev",
  aforo_promedio: 1500,
  estado_cuenta: "activo",
  logoUrl: "",
  logo_url: "",
  imagen_url: "",
  notas: "Banda seria estilo Metallica con temática de ingeniería de software e Inteligencia Artificial."
};

export const HERDEIROS_REGISTERED_BAND = {
  id: "reg-os-herdeiros-do-codigo",
  band_id: HERDEIROS_BAND_ID,
  user_id: "user-mouredev",
  fecha_registro: "2026-01-01T10:00:00.000Z",
  nombre_banda: "Os Herdeiros do Código",
  email: "mouredev@gmail.com",
  plan: "cabeza_de_cartel",
  contacto_nombre: "Brais Moure",
  estilo_musical: "Rock Bravú / Punk-Rock Galaico",
  localizacion: "A Coruña (Galicia, España)",
  telefono: "+34 688 101 010",
  instagram: "@mouredev",
  aforo_promedio: 400,
  estado_cuenta: "activo",
  logoUrl: "",
  logo_url: "",
  notas: "Banda rock bravú galaica de Brais Moure"
};

export function ensureBakandeyaBandId(state: any): boolean {
  let changed = false;

  if (!state.registeredBands || !Array.isArray(state.registeredBands)) {
    state.registeredBands = [BAKANDEYA_REGISTERED_BAND, VERTICE_REGISTERED_BAND, HERDEIROS_REGISTERED_BAND, MASTER_OF_PROMPTS_REGISTERED_BAND];
    changed = true;
  } else {
    const existingBakandeya = state.registeredBands.find(
      (b: any) => b.band_id === BAKANDEYA_BAND_ID || String(b.nombre_banda || "").toLowerCase() === "bakandeya"
    );
    if (!existingBakandeya) {
      state.registeredBands.unshift(BAKANDEYA_REGISTERED_BAND);
      changed = true;
    } else if (existingBakandeya.band_id !== BAKANDEYA_BAND_ID) {
      existingBakandeya.band_id = BAKANDEYA_BAND_ID;
      changed = true;
    }

    const existingVertice = state.registeredBands.find(
      (b: any) => b.band_id === "band-vertice" || b.band_id === "vertice" || b.id === "reg-vertice" || String(b.nombre_banda || "").toLowerCase() === "vertice" || String(b.nombre_banda || "").toLowerCase() === "vértice"
    );
    if (!existingVertice) {
      state.registeredBands.push(VERTICE_REGISTERED_BAND);
      changed = true;
    } else if (existingVertice.band_id !== "band-vertice") {
      existingVertice.band_id = "band-vertice";
      changed = true;
    }

    const existingHerdeiros = state.registeredBands.find(
      (b: any) => (b.band_id || '').replace(/^(band|reg)-/, '') === 'os-herdeiros-do-codigo'
    );
    if (!existingHerdeiros && !process.env.SUPABASE_URL) {
      state.registeredBands.push(HERDEIROS_REGISTERED_BAND);
      changed = true;
    }

    const existingMop = state.registeredBands.find(
      (b: any) => (b.band_id || '').replace(/^(band|reg)-/, '') === 'master-of-prompts'
    );
    if (!existingMop && !process.env.SUPABASE_URL) {
      state.registeredBands.push(MASTER_OF_PROMPTS_REGISTERED_BAND);
      changed = true;
    }
  }

  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      if (b.nombre_banda && b.nombre_banda.toLowerCase() !== "bakandeya" && b.nombre_banda.toLowerCase() !== "vértice" && b.nombre_banda.toLowerCase() !== "vertice") {
        const cleanSlug = slugify(b.nombre_banda);
        if (cleanSlug && (b.band_id === BAKANDEYA_BAND_ID || b.band_id.startsWith("user-"))) {
          b.band_id = `band-${cleanSlug}`;
          changed = true;
        }
      }
    }
  }

  if (state.users && Array.isArray(state.users)) {
    const initialSeedUserIds = new Set(['user-jose', 'user-diego', 'user-jon', 'user-elyar', 'user-raul']);
    for (const u of state.users) {
      if (u.id === 'user-admin' || u.username?.toLowerCase() === 'admin') {
        const cleanCurrent = (u.band_id || '').replace(/^(band|reg)-/, '');
        if (!u.band_id || cleanCurrent !== 'vertice' || u.band_id === 'vertice') {
          u.band_id = 'band-vertice';
          u.bandName = 'Vértice';
          u.main_band_id = 'band-vertice';
          changed = true;
        }
      } else if (
        u.id === 'user-mouredev' ||
        u.username?.toLowerCase() === 'mouredev' ||
        u.username?.toLowerCase() === 'braismouredev' ||
        u.email?.toLowerCase().includes('mouredev') ||
        u.email?.toLowerCase().includes('braismouredev')
      ) {
        const cleanCurrent = (u.band_id || '').replace(/^(band|reg)-/, '');
        if (cleanCurrent === 'master-of-prompts') {
          if (u.band_id !== 'band-master-of-prompts' || u.bandName !== 'Master of Prompts' || u.instrument !== 'Batería') {
            u.band_id = 'band-master-of-prompts';
            u.bandName = 'Master of Prompts';
            u.instrument = 'Batería';
            changed = true;
          }
        } else if (cleanCurrent === 'os-herdeiros-do-codigo') {
          if (u.band_id !== 'band-os-herdeiros-do-codigo' || u.bandName !== 'Os Herdeiros do Código' || u.instrument !== 'Batería') {
            u.band_id = 'band-os-herdeiros-do-codigo';
            u.bandName = 'Os Herdeiros do Código';
            u.instrument = 'Batería';
            changed = true;
          }
        } else {
          u.band_id = 'band-os-herdeiros-do-codigo';
          u.bandName = 'Os Herdeiros do Código';
          u.main_band_id = 'band-os-herdeiros-do-codigo';
          u.instrument = 'Batería';
          changed = true;
        }
      } else if (initialSeedUserIds.has(u.id)) {
        // Estos 5 ids son las cuentas fundadoras de Bakandeya (incluido user-diego, la cuenta real
        // que usa la app). Antes esto forzaba SIEMPRE band_id de vuelta a Bakandeya en cada
        // loadState() -y loadState() se llama en casi cada petición-, así que un cambio de banda
        // válido hecho con /auth/switch-band o /users/create-band se deshacía solo en la
        // siguientísima petición: era imposible que estas cuentas se quedaran en ninguna otra
        // banda (STOMP, SWINDIGENTES...) aunque la tuvieran legítimamente vinculada en userBands.
        // Ahora solo se repara si band_id falta o apunta a una banda a la que el usuario ya no
        // tiene acceso real, en vez de pisar siempre un cambio de banda que sigue siendo válido.
        const cleanCurrent = (u.band_id || '').replace(/^(band|reg)-/, '');
        const uEmailSeed = (u.email || u.username || '').toLowerCase();
        const hasValidAccess =
          cleanCurrent === 'bakandeya' ||
          (state.userBands || []).some((ub: any) => ub.user_id === u.id && (ub.band_id || '').replace(/^(band|reg)-/, '') === cleanCurrent) ||
          (state.registeredBands || []).some((b: any) =>
            (b.user_id === u.id || (uEmailSeed && b.email?.toLowerCase() === uEmailSeed)) &&
            ((b.band_id || '').replace(/^(band|reg)-/, '') === cleanCurrent || (b.id || '').replace(/^(band|reg)-/, '') === cleanCurrent)
          );
        if (!u.band_id || !hasValidAccess) {
          u.band_id = BAKANDEYA_BAND_ID;
          u.bandName = "Bakandeya";
          changed = true;
        }
      } else {
        // Find matching registered bands for this user
        const uEmail = u.email?.toLowerCase();
        const matchingBands = state.registeredBands?.filter((b: any) =>
          (uEmail && b.email?.toLowerCase() === uEmail) || b.nombre_banda === u.name || b.nombre_banda === u.bandName
        ) || [];

        // Ensure user_id is linked on matching registered bands
        matchingBands.forEach((b: any) => {
          if (!b.user_id || b.user_id.startsWith("user-17")) {
            b.user_id = u.id;
            changed = true;
          }
        });

        const currentBandValid = matchingBands.some((b: any) => b.band_id === u.band_id) ||
          state.userBands?.some((ub: any) => ub.user_id === u.id && ub.band_id === u.band_id);

        if (!currentBandValid && matchingBands.length > 0) {
          const nameMatchedBand = matchingBands.find((b: any) =>
            b.nombre_banda && (b.nombre_banda.toLowerCase() === u.name?.toLowerCase() || b.nombre_banda.toLowerCase() === u.bandName?.toLowerCase())
          );
          const targetBandObj = nameMatchedBand || matchingBands[0];
          u.band_id = targetBandObj.band_id;
          if (targetBandObj.nombre_banda) u.bandName = targetBandObj.nombre_banda;
          changed = true;
        } else if (!u.band_id || u.band_id.startsWith('user-')) {
          u.band_id = `band-${slugify(u.bandName || u.name || u.id.replace('user-', ''))}`;
          changed = true;
        }
      }
    }
  }

  if (!state.userBands || !Array.isArray(state.userBands)) {
    state.userBands = [];
    changed = true;
  }

  // Purge any accidental Bakandeya link for user-mouredev
  const beforeLen = state.userBands.length;
  state.userBands = state.userBands.filter((ub: any) => {
    const isMoure = ub.user_id === 'user-mouredev' || (ub.email && String(ub.email).toLowerCase().includes('mouredev'));
    const isBak = (ub.band_id || '').replace(/^(band|reg)-/, '') === 'bakandeya';
    return !(isMoure && isBak);
  });
  if (state.userBands.length !== beforeLen) changed = true;

  // Ensure all current users have their active bands in userBands. Un usuario sin band_id
  // todavía (cuenta nueva sin banda asignada) no tiene banda activa que registrar aquí: antes se
  // le daba de alta en silencio como miembro de band-bakandeya.
  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      if (!u.band_id) return;
      const bid = u.band_id;
      const hasUB = state.userBands.some((ub: any) => ub.user_id === u.id && ub.band_id === bid);
      if (!hasUB) {
        state.userBands.push({
          id: `ub-${u.id}-${bid}`,
          user_id: u.id,
          band_id: bid,
          role: u.role || "member",
          createdAt: u.createdAt || new Date().toISOString()
        });
        changed = true;
      }
    });
  }

  // Ensure all registered bands have leader associations in userBands
  if (state.registeredBands && Array.isArray(state.registeredBands)) {
    state.registeredBands.forEach((rb: any) => {
      if (!rb.band_id) return;
      const rbEmail = (rb.email || "").toLowerCase();
      const matchingUsers = (state.users || []).filter((u: any) =>
        u.id === rb.user_id ||
        (rbEmail && (u.email?.toLowerCase() === rbEmail || u.username?.toLowerCase() === rbEmail))
      );

      // If no user object matched yet, but rb has user_id, use that user_id
      const userIdsToLink = new Set<string>(matchingUsers.map((u: any) => u.id));
      if (rb.user_id) userIdsToLink.add(rb.user_id);

      userIdsToLink.forEach((uid) => {
        const hasUB = state.userBands.some((ub: any) => ub.user_id === uid && ub.band_id === rb.band_id);
        if (!hasUB) {
          state.userBands.push({
            id: `ub-${uid}-${rb.band_id}`,
            user_id: uid,
            band_id: rb.band_id,
            role: "leader",
            createdAt: rb.fecha_registro || new Date().toISOString()
          });
          changed = true;
        }
      });
    });
  }

  if (state.leads && Array.isArray(state.leads)) {
    const hasTestLead = state.leads.some((l: any) => l.id === "lead-test-telemetry-diego" || (l.email_contacto === "diego.delacalleb@gmail.com" && l.nombre_sala?.includes("Mon")));
    if (!hasTestLead) {
      const testLeadObj = {
        id: "lead-test-telemetry-diego",
        nombre_sala: "Sala Mon Live (Test Telemetría)",
        ciudad: "Madrid",
        region: "Comunidad de Madrid",
        aforo: 800,
        genero: "Indie / Rock / Fusión",
        email_contacto: "diego.delacalleb@gmail.com",
        telefono: "+34 914 455 678",
        instagram: "@monlivemadrid",
        fuente: "Test Telemetría",
        estado: "pendiente_aprobacion",
        band_id: BAKANDEYA_BAND_ID,
        pitch_generado: `Hola Diego,

Nos ponemos en contacto desde la oficina de Bakandeya. Sabemos que Sala Mon es uno de los espacios con mejor acústica y ambiente de conciertos en directo en Madrid.

Estamos preparando el tramo de otoño de nuestra gira y nos encantaría presentar el directo en vuestra sala. Tenéis el dossier oficial interactivo en el enlace adjunto.

¿Tendríais alguna fecha disponible para valorar en noviembre?

Un saludo cordial,
Bakandeya Booking`,
        notas: "*** Sala de prueba creada para verificar la telemetría, apertura de emails y clics en el dossier en tiempo real ***"
      };
      state.leads.unshift(testLeadObj);
      changed = true;
    }
  }

  const collections = ['leads', 'rehearsals', 'concerts', 'posts', 'payments', 'metrics', 'songs', 'setlists', 'tours', 'fans', 'bands', 'messages'];
  for (const colKey of collections) {
    if (state[colKey] && Array.isArray(state[colKey])) {
      for (const item of state[colKey]) {
        if (!item.band_id) {
          item.band_id = BAKANDEYA_BAND_ID;
          changed = true;
        }
        if (colKey === 'leads' && item.hilo_emails && Array.isArray(item.hilo_emails)) {
          for (const msg of item.hilo_emails) {
            if (!msg.band_id) {
              msg.band_id = item.band_id;
              changed = true;
            }
          }
        }
      }
    }
  }

  if (state.runOfShow) {
    for (const key of Object.keys(state.runOfShow)) {
      if (Array.isArray(state.runOfShow[key])) {
        for (const item of state.runOfShow[key]) {
          if (!item.band_id) {
            item.band_id = BAKANDEYA_BAND_ID;
            changed = true;
          }
        }
      }
    }
  }

  if (state.gearChecklists) {
    for (const key of Object.keys(state.gearChecklists)) {
      if (Array.isArray(state.gearChecklists[key])) {
        for (const item of state.gearChecklists[key]) {
          if (!item.band_id) {
            item.band_id = BAKANDEYA_BAND_ID;
            changed = true;
          }
        }
      }
    }
  }

  if (!state.epkConfigsByBand) {
    state.epkConfigsByBand = {
      [BAKANDEYA_BAND_ID]: state.epkConfig || DEFAULT_EPK_CONFIG
    };
    changed = true;
  } else if (!state.epkConfigsByBand[BAKANDEYA_BAND_ID] && state.epkConfig) {
    state.epkConfigsByBand[BAKANDEYA_BAND_ID] = state.epkConfig;
    changed = true;
  }

  if (migrateTimestampIdsToPersonalized(state)) {
    changed = true;
  }

  if (ensureUniqueIdsInState(state)) {
    changed = true;
  }

  if (ensureValidUserEmails(state)) {
    changed = true;
  }

  return changed;
}

export function ensureMouredevBandsData(_state: any): boolean {
  // Los datos de MoureDev (Os Herdeiros do Código y Master of Prompts)
  // ya están 100% migrados y persisten directamente en Supabase PostgreSQL.
  // Desconectado para permitir edición completa desde la UI sin sobreescrituras estáticas.
  return false;
}

export function ensureValidUserEmails(state: any): boolean {
  let changed = false;
  if (!state.users || !Array.isArray(state.users)) return false;

  for (const u of state.users) {
    const initUser = INITIAL_USERS.find(
      (iu: any) => iu.id === u.id || (iu.username && iu.username.toLowerCase() === u.username?.toLowerCase())
    );
    if (initUser?.email && (!u.email || !u.email.includes("@") || u.email.toLowerCase() === u.username?.toLowerCase())) {
      u.email = initUser.email;
      changed = true;
    }
    if ((!u.email || !u.email.includes("@")) && u.username && u.username.includes("@")) {
      u.email = u.username.toLowerCase().trim();
      changed = true;
    }
  }
  return changed;
}

function cleanBidStr(bid: any): string {
  if (!bid) return '';
  return String(bid).replace(/^(band|reg)-/, '').replace(/(-\d+)+$/, '');
}

export function ensureUniqueIdsInState(state: any): boolean {
  let changed = false;

  const collections = [
    'songs', 'setlists', 'leads', 'rehearsals', 'concerts', 'posts',
    'payments', 'metrics', 'tours', 'fans', 'bands', 'users', 'registeredBands', 'messages', 'userBands'
  ];

  for (const colKey of collections) {
    if (Array.isArray(state[colKey])) {
      const originalLen = state[colKey].length;
      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const cleanArray: any[] = [];

      state[colKey].forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') return;

        const itemId = item.id ? String(item.id).trim() : null;
        if (itemId && seenIds.has(itemId)) {
          return;
        }

        let key = '';
        const bid = cleanBidStr(item.band_id || '');

        if (colKey === 'registeredBands') {
          const rBid = cleanBidStr(item.band_id || item.id || '');
          const email = (item.email || '').trim().toLowerCase();
          key = email ? `reg:${rBid}:${email}` : (rBid || item.id || `rb-${idx}`);
        } else if (colKey === 'songs') {
          const title = (item.titulo || item.id || '').trim().toLowerCase();
          key = `song:${title}:${bid}`;
        } else if (colKey === 'setlists') {
          const name = (item.nombreSetlist || item.id || '').trim().toLowerCase();
          key = `setlist:${name}:${bid}`;
        } else if (colKey === 'bands') {
          const bId = cleanBidStr(item.band_id || item.id || '');
          const bName = (item.nombre_banda || '').trim().toLowerCase();
          key = bName ? `band:${bName}:${bid}` : (bId || item.id || `b-${idx}`);
        } else if (colKey === 'userBands') {
          key = `ub:${item.user_id}:${item.band_id}`;
        } else if (colKey === 'users') {
          const uname = (item.username || '').trim().toLowerCase();
          const uemail = (item.email || '').trim().toLowerCase();
          key = uemail ? `user:email:${uemail}` : (uname ? `user:uname:${uname}` : (item.id || `u-${idx}`));
        } else if (colKey === 'fans') {
          const femail = (item.email || '').trim().toLowerCase();
          const fname = (item.nombre || '').trim().toLowerCase();
          const fciudad = (item.ciudad || '').trim().toLowerCase();
          key = femail ? `fan:email:${femail}:${bid}` : (fname && fciudad ? `fan:${fname}:${fciudad}:${bid}` : (item.id || `fan-${idx}`));
        } else if (colKey === 'leads') {
          const lsala = (item.nombre_sala || '').trim().toLowerCase();
          const lciudad = (item.ciudad || '').trim().toLowerCase();
          const lemail = (item.email_contacto || '').trim().toLowerCase();
          key = lemail ? `lead:email:${lemail}:${bid}` : (lsala && lciudad ? `lead:${lsala}:${lciudad}:${bid}` : (item.id || `lead-${idx}`));
        } else if (colKey === 'concerts') {
          const cfecha = (item.fecha || '').trim();
          const csala = (item.sala || item.nombre || '').trim().toLowerCase();
          key = cfecha && csala ? `concert:${cfecha}:${csala}:${bid}` : (item.id || `concert-${idx}`);
        } else if (colKey === 'rehearsals') {
          const rfecha = (item.fecha || '').trim();
          const rlugar = (item.lugar || item.titulo || '').trim().toLowerCase();
          key = rfecha && rlugar ? `rehearsal:${rfecha}:${rlugar}:${bid}` : (item.id || `rehearsal-${idx}`);
        } else if (colKey === 'posts') {
          const pfecha = (item.fecha || '').trim();
          const ptitle = (item.titulo || item.caption || '').trim().toLowerCase();
          key = ptitle ? `post:${ptitle}:${bid}` : (item.id || `post-${idx}`);
        } else if (colKey === 'payments') {
          const pconc = (item.concepto || '').trim().toLowerCase();
          const pfecha = (item.fecha || '').trim();
          const pmonto = String(item.monto || item.cantidad || item.importe || 0);
          key = pconc && pfecha ? `payment:${pfecha}:${pconc}:${pmonto}:${bid}` : (item.id || `payment-${idx}`);
        } else if (colKey === 'metrics') {
          const mfecha = (item.fecha || '').trim();
          const mplat = (item.plataforma || '').trim().toLowerCase();
          key = mfecha && mplat ? `metric:${mfecha}:${mplat}:${bid}` : (item.id || `metric-${idx}`);
        } else if (colKey === 'tours') {
          const tname = (item.nombre || '').trim().toLowerCase();
          key = tname ? `tour:${tname}:${bid}` : (item.id || `tour-${idx}`);
        } else {
          key = item.id || `${colKey}-${idx}`;
        }

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          if (itemId) seenIds.add(itemId);
          cleanArray.push(item);
        }
      });

      if (cleanArray.length !== originalLen) {
        state[colKey] = cleanArray;
        changed = true;
      }
    }
  }

  return changed;
}

export function migrateTimestampIdsToPersonalized(state: any): boolean {
  let changed = false;
  const existingIds = new Set<string>();

  const isTimestampId = (id: any) => typeof id === "string" && /^(user|band|reg)-\d{8,}$/.test(id);
  const idMap = new Map<string, string>();

  // Register non-timestamp IDs
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      if (u.id && !isTimestampId(u.id)) existingIds.add(u.id);
      if (u.band_id && !isTimestampId(u.band_id)) existingIds.add(u.band_id);
    }
  }
  if (Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      if (b.id && !isTimestampId(b.id)) existingIds.add(b.id);
      if (b.band_id && !isTimestampId(b.band_id)) existingIds.add(b.band_id);
    }
  }

  // 1. Process registeredBands
  if (Array.isArray(state.registeredBands)) {
    for (const b of state.registeredBands) {
      const bandName = b.nombre_banda || b.contacto_nombre || "banda";
      if (isTimestampId(b.band_id)) {
        if (!idMap.has(b.band_id)) {
          const newBandId = generateUniqueSlugId("band", bandName, existingIds);
          existingIds.add(newBandId);
          idMap.set(b.band_id, newBandId);
        }
        b.band_id = idMap.get(b.band_id)!;
        changed = true;
      }
      if (isTimestampId(b.id)) {
        if (!idMap.has(b.id)) {
          const newRegId = generateUniqueSlugId("reg", bandName, existingIds);
          existingIds.add(newRegId);
          idMap.set(b.id, newRegId);
        }
        b.id = idMap.get(b.id)!;
        changed = true;
      }
    }
  }

  // 2. Process users
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      const bandName = u.bandName || u.name || "banda";
      const userRaw = u.username?.includes("@") ? u.username.split("@")[0] : (u.username || u.name || "usuario");

      if (isTimestampId(u.band_id)) {
        if (!idMap.has(u.band_id)) {
          const newBandId = generateUniqueSlugId("band", bandName, existingIds);
          existingIds.add(newBandId);
          idMap.set(u.band_id, newBandId);
        }
        u.band_id = idMap.get(u.band_id)!;
        changed = true;
      }

      if (isTimestampId(u.id)) {
        if (!idMap.has(u.id)) {
          const newUserId = generateUniqueSlugId("user", userRaw, existingIds);
          existingIds.add(newUserId);
          idMap.set(u.id, newUserId);
        }
        u.id = idMap.get(u.id)!;
        changed = true;
      }
    }
  }

  // 3. Update references across collections
  if (idMap.size > 0) {
    const collections = ['leads', 'rehearsals', 'concerts', 'posts', 'payments', 'metrics', 'songs', 'setlists', 'tours', 'fans', 'bands', 'messages'];
    for (const colKey of collections) {
      if (state[colKey] && Array.isArray(state[colKey])) {
        for (const item of state[colKey]) {
          if (item.band_id && idMap.has(item.band_id)) {
            item.band_id = idMap.get(item.band_id)!;
            changed = true;
          }
          if (colKey === 'leads' && Array.isArray(item.hilo_emails)) {
            for (const msg of item.hilo_emails) {
              if (msg.band_id && idMap.has(msg.band_id)) {
                msg.band_id = idMap.get(msg.band_id)!;
                changed = true;
              }
            }
          }
        }
      }
    }

    if (state.epkConfigsByBand) {
      for (const [oldId, newId] of idMap.entries()) {
        if (state.epkConfigsByBand[oldId]) {
          state.epkConfigsByBand[newId] = state.epkConfigsByBand[oldId];
          delete state.epkConfigsByBand[oldId];
          changed = true;
        }
      }
    }

    for (const token of Object.keys(ACTIVE_SESSIONS)) {
      const sess = ACTIVE_SESSIONS[token];
      if (sess?.userId && idMap.has(sess.userId)) {
        sess.userId = idMap.get(sess.userId)!;
        changed = true;
      }
    }
  }

  return changed;
}

export function getDefaultEpkConfig(bandName: string = "Tu Banda", email?: string): any {
  return {
    biografia: `${bandName} es una propuesta musical en directo.`,
    logoUrl: "",
    bandPhotos: [],
    riderTecnico: "Rider técnico y necesidades de escenario por definir.",
    enlacesRedes: {
      spotify: "",
      youtube: "",
      instagram: "",
      tiktok: "",
      website: ""
    },
    contactoBooking: {
      nombre: bandName,
      email: email || "",
      telefono: ""
    },
    temasDestacadosIds: [],
    incentivoFans: {
      mensajeAgradecimiento: `¡Muchas gracias por unirte a la comunidad de ${bandName}!`,
      enlaceDescarga: "",
      codigoDescuento: ""
    }
  };
}

export function getEpkConfigForBand(state: any, bandId: string, bandName: string = "Tu Banda", email?: string): any {
  if (!bandId || typeof bandId !== 'string' || !bandId.trim()) {
    // Antes, un bandId vacío devolvía en silencio el EPK real de Bakandeya (email, teléfono y
    // logo del fundador) a cualquier llamador que se olvidara de pasar la banda. Mejor fallar alto.
    throw new Error("getEpkConfigForBand: se requiere un band_id válido; no hay banda por defecto.");
  }
  if (!state.epkConfigsByBand) {
    state.epkConfigsByBand = {};
  }
  const cleanId = bandId.replace(/^(band|reg)-/, '');
  const possibleKeys = [
    bandId,
    cleanId,
    `band-${cleanId}`,
    `reg-${cleanId}`
  ].filter(Boolean);

  let existing = possibleKeys
    .map(k => state.epkConfigsByBand[k])
    .find(cfg => cfg && (cfg.logoUrl || cfg.biografia || cfg.nombre_banda));

  if (!existing) {
    existing = getDefaultEpkConfig(bandName, email);
  }

  // Ensure logoUrl fallback if missing or empty
  if (!existing.logoUrl || existing.logoUrl.trim() === '' || existing.logoUrl.includes('sin_fondo')) {
    // Comparación case-insensitive (igual que en buildAvailableBandsForUser/getPlanForBand): un
    // band_id con mayúsculas (p. ej. "band-STOMP") no encontraba aquí su propia fila en
    // registeredBands por comparación exacta, dejando el logo vacío aunque sí existiera guardado.
    const cleanIdLower = cleanId.toLowerCase().trim();
    const regBand = (state.registeredBands || []).find((b: any) => {
      const bBid = (b.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      const bId = (b.id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      return b.band_id === bandId || b.id === bandId || bBid === cleanIdLower || bId === cleanIdLower;
    });
    if (regBand?.logo_url && regBand.logo_url.trim().length > 0) {
      existing.logoUrl = regBand.logo_url;
    } else if (regBand?.imagen_url && regBand.imagen_url.trim().length > 0) {
      existing.logoUrl = regBand.imagen_url;
    }
  }

  // Populate all key variations so any future lookup with band-*, reg-*, or raw cleanId gets the same object
  for (const k of possibleKeys) {
    state.epkConfigsByBand[k] = existing;
  }

  return existing;
}

export function getAutonomyConfigForBand(state: any, bandId: string): any {
  if (!bandId || typeof bandId !== 'string' || !bandId.trim()) {
    throw new Error("getAutonomyConfigForBand: se requiere un band_id válido; no hay banda por defecto.");
  }
  if (!state.autonomyConfigsByBand) {
    state.autonomyConfigsByBand = {};
  }
  const cleanId = bandId.replace(/^(band|reg)-/, '');
  const possibleKeys = [
    bandId,
    cleanId,
    `band-${cleanId}`,
    `reg-${cleanId}`
  ].filter(Boolean);

  let existing = possibleKeys
    .map(k => state.autonomyConfigsByBand[k])
    .find(cfg => cfg && cfg.dispatchLevel);

  if (!existing) {
    existing = { ...DEFAULT_AUTONOMY_CONFIG };
  }

  for (const k of possibleKeys) {
    state.autonomyConfigsByBand[k] = existing;
  }

  return existing;
}

let inMemoryStateCache: any = null;

export function invalidateStateCache(): void {
  inMemoryStateCache = null;
}

export function loadState(): any {
  if (inMemoryStateCache) {
    return inMemoryStateCache;
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      if (!content || content.trim() === "") {
        throw new Error("data.json is empty");
      }
      const state = JSON.parse(content);
      
      let changed = false;

      if (!state.autonomyConfigsByBand) {
        state.autonomyConfigsByBand = {
          [BAKANDEYA_BAND_ID]: DEFAULT_AUTONOMY_CONFIG
        };
        changed = true;
      }

      if (!state.epkConfig) {
        state.epkConfig = DEFAULT_EPK_CONFIG;
        changed = true;
      }

      if (!state.fans || !Array.isArray(state.fans)) {
        state.fans = INITIAL_FANS;
        changed = true;
      }
      
      if (!state.metrics) {
        state.metrics = INITIAL_SOCIAL_METRICS;
        changed = true;
      }

      if (!state.runOfShow) {
        state.runOfShow = INITIAL_RUN_OF_SHOW;
        changed = true;
      }

      if (!state.gearChecklists) {
        state.gearChecklists = INITIAL_GEAR_CHECKLISTS;
        changed = true;
      }

      if (!state.songs || !Array.isArray(state.songs)) {
        state.songs = INITIAL_SONGS;
        changed = true;
      } else {
        for (const initSong of INITIAL_SONGS) {
          const s = state.songs.find((es: any) => es.id === initSong.id);
          if (s) {
            if (typeof s.energia !== 'number' || (initSong.energia && s.energia !== initSong.energia && !s.energiaManual)) {
              s.energia = initSong.energia;
              s.energiaManual = initSong.energiaManual;
              s.energia_manual = initSong.energiaManual;
              changed = true;
            }
          }
        }
      }

      if (!state.setlists || !Array.isArray(state.setlists)) {
        state.setlists = INITIAL_SETLISTS;
        changed = true;
      }
      if (!state.tours || !Array.isArray(state.tours)) {
        state.tours = INITIAL_TOURS;
        changed = true;
      }
      if (!state.bands || !Array.isArray(state.bands)) {
        state.bands = INITIAL_BANDS;
        changed = true;
      }

      if (!state.users || !Array.isArray(state.users)) {
        state.users = [];
      }

      if (state.users.some((u: any) => u.username.toLowerCase() === 'larra')) {
        state.users = state.users.filter((u: any) => u.username.toLowerCase() !== 'larra');
        changed = true;
      }

      for (const initUser of INITIAL_USERS) {
        const existing = state.users.find(
          (u: any) => u.username.toLowerCase() === initUser.username.toLowerCase()
        );
        if (!existing) {
          const { hash, salt } = hashPassword(initUser.initialPassword);
          state.users.push({
            id: initUser.id,
            username: initUser.username,
            name: initUser.name,
            email: initUser.email,
            role: initUser.role,
            instrument: initUser.instrument,
            avatarColor: initUser.avatarColor,
            passwordHash: hash,
            salt: salt,
            createdAt: initUser.createdAt
          });
          changed = true;
        } else {
          if (!existing.email || !existing.email.includes("@") || existing.email === existing.username) {
            existing.email = initUser.email;
            changed = true;
          }
          if (existing.instrument !== initUser.instrument) {
            existing.instrument = initUser.instrument;
            changed = true;
          }
        }
      }

      if (state.leads) {
        if (!state.leads.some((l: any) => l.id === "lead-14")) {
          const hebeLead = INITIAL_LEADS.find(l => l.id === "lead-14");
          if (hebeLead) {
            state.leads.push(hebeLead);
            changed = true;
          }
        }
        
        state.leads = state.leads.map((l: any) => {
          const seedLead = INITIAL_LEADS.find((sl) => sl.id === l.id);
          if (seedLead && seedLead.hilo_emails && (!l.hilo_emails || l.hilo_emails.length === 0)) {
            l.hilo_emails = seedLead.hilo_emails;
            changed = true;
          }
          if (l.id === 'lead-siroco' && l.email_contacto === 'booking@salasiroco.es') {
            l.email_contacto = 'booking@siroco.es';
            l.website = 'https://siroco.es/';
            changed = true;
          }
          return l;
        });
      }
      
      if (ensureBakandeyaBandId(state)) {
        changed = true;
      }

      ensureCategoryTemplatesInState(state);

      if (ensureUniqueIdsInState(state)) {
        changed = true;
      }

      if (changed) {
        saveState(state);
      } else {
        inMemoryStateCache = state;
      }

      return state;
    } catch (e) {
      console.error("Error reading data.json, falling back to seed data", e);
    }
  }
  
  const defaultState = {
    registeredBands: [BAKANDEYA_REGISTERED_BAND],
    epkConfig: DEFAULT_EPK_CONFIG,
    fans: INITIAL_FANS,
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES,
    metrics: INITIAL_SOCIAL_METRICS,
    runOfShow: INITIAL_RUN_OF_SHOW,
    gearChecklists: INITIAL_GEAR_CHECKLISTS,
    songs: INITIAL_SONGS,
    setlists: INITIAL_SETLISTS,
    bands: INITIAL_BANDS,
    tours: INITIAL_TOURS,
    users: INITIAL_USERS.map((u: any) => {
      const { hash, salt } = hashPassword(u.initialPassword);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        instrument: u.instrument,
        avatarColor: u.avatarColor,
        passwordHash: hash,
        salt: salt,
        createdAt: u.createdAt,
        band_id: BAKANDEYA_BAND_ID,
        bandName: "Bakandeya"
      };
    })
  };
  ensureBakandeyaBandId(defaultState);
  ensureUniqueIdsInState(defaultState);
  saveState(defaultState);
  inMemoryStateCache = defaultState;
  return defaultState;
}

export function saveState(state: any) {
  try {
    ensureUniqueIdsInState(state);
    inMemoryStateCache = state;
    const tmpFile = `${DATA_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
    const content = JSON.stringify(state, null, 2);
    fs.writeFileSync(tmpFile, content, "utf-8");
    try {
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (renameErr) {
      // Fallback si rename falla entre montajes o permisos de disco
      fs.writeFileSync(DATA_FILE, content, "utf-8");
      if (fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile); } catch (_) {}
      }
    }
  } catch (e) {
    console.error("Error saving data.json", e);
  }
}

export function getUserFromRequestLocal(req: express.Request): { id: string; role: string; username: string; band_id?: string; bandName?: string; email?: string } | null {
  return getUserFromRequest(req, loadState);
}

export const requireAuth = createAuthMiddleware(loadState);
export const requireLeader = createLeaderMiddleware(loadState);
export const requireCronOrAuth = createCronOrAuthMiddleware(loadState);
