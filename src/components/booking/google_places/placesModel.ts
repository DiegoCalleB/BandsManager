/**
 * Modelo del explorador de lugares: tipos, categorías, ciudades rápidas y descartados persistidos.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { LeadType } from "../../../types";

export interface PlaceResult {
  place_id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion: string;
  telefono: string;
  website: string;
  rating?: number | null;
  user_ratings_total?: number | null;
  tipo: LeadType | string;
  aforo?: number;
  genero?: string;
  descripcion?: string;
  imagen_url?: string;
  icono?: string;
  email_contacto?: string;
  instagram?: string;
  contacto_nombre?: string;
  fuente?: string;
  selected?: boolean;
  extractingEmail?: boolean;
  alreadyInCrm?: boolean;
  crmStatus?: string | null;
  crmId?: string | null;
  crmNombre?: string | null;
  capacityMatch?: boolean;
}

export interface DiscardedPlace {
  place_id?: string;
  nombre_sala: string;
  ciudad?: string;
  tipo?: string;
  discarded_at: string;
}

const DISCARDED_STORAGE_KEY = "bandmanager_scout_discarded_places";

export function getStoredDiscarded(): DiscardedPlace[] {
  try {
    const raw = localStorage.getItem(DISCARDED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredDiscarded(list: DiscardedPlace[]) {
  try {
    localStorage.setItem(DISCARDED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Cuota llena o almacenamiento bloqueado: el descarte sigue vivo en memoria durante la sesión.
  }
}


/** Mensaje de un error capturado, o `undefined` si no es un `Error`. */
export function errorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

/** Recinto devuelto por el radar de afinidad (bandas similares). */
export interface SimilarVenueItem {
  nombre_sala: string;
  ciudad?: string;
  aforo_estimado?: number;
  genero_predominante?: string;
  razon_recomendacion?: string;
  bandas_similares_que_tocaron?: string[];
  contacto_sugerido?: string;
  fuente?: string;
}

/** Recinto devuelto por la búsqueda multifuente. */
export interface MultiSourceVenueItem {
  nombre: string;
  ciudad?: string;
  pais?: string;
  direccion?: string;
  telefono?: string;
  url_oficial?: string;
  tipo?: LeadType;
  capacidad?: number;
  generos_frecuentes?: string[];
  detalles_tecnicos?: string;
  email?: string;
  fuente?: string;
  fuentes_verificadas?: string[];
}

/** Convocatoria pública que devuelve `POST /api/leads/public-cultural-radar` en `leads_publicos`. */
export interface OportunidadCultural {
  entidad_publica: string;
  ciudad: string;
  provincia: string;
  comunidad_autonoma: string;
  evento_o_ciclo: string;
  tecnico_cultura_contacto?: string;
  email_contacto?: string;
  telefono_oficial?: string;
  presupuesto_estimado_categoria?: string;
  ventana_presentacion_dossier?: string;
  requisitos_contratacion?: string;
  fuente: string;
  fiabilidad: string;
}

/**
 * Convierte una convocatoria del radar cultural en un resultado del explorador.
 * @param op Convocatoria tal como la devuelve el servidor.
 * @param idx Posición en la lista (para un `place_id` estable dentro de la búsqueda).
 * @param regionConsultada Región buscada, usada si la convocatoria no trae ciudad ni provincia.
 * @param generoBanda Género de la banda; si está vacío se muestra "Cultural".
 */
export function oportunidadCulturalAPlace(op: OportunidadCultural, idx: number, regionConsultada: string, generoBanda: string): PlaceResult {
  return {
    place_id: `cultural-${Date.now()}-${idx}`,
    nombre_sala: op.entidad_publica,
    ciudad: op.ciudad || regionConsultada,
    region: op.provincia || regionConsultada,
    direccion: op.ciudad || "",
    telefono: op.telefono_oficial || "",
    website: "",
    tipo: /ayuntamiento/i.test(op.entidad_publica) ? "ayuntamiento" : "sala",
    genero: generoBanda || "Cultural",
    descripcion: `${op.evento_o_ciclo || ""} · ${op.requisitos_contratacion || ""} (${op.ventana_presentacion_dossier || "Convocatoria"})`,
    email_contacto: op.email_contacto || "",
    contacto_nombre: op.tecnico_cultura_contacto || "",
    fuente: `Radar Cultural Público (${op.fuente || "Datos Abiertos & Municipios"})`,
  };
}

export const QUICK_CITIES = [
  "Madrid",
  "Barcelona",
  "Sevilla",
  "Valencia",
  "Málaga",
  "Bilbao",
  "Granada",
  "Zaragoza",
  "Huelva",
  "Alicante",
  "Santiago",
  "Vigo",
  "Salamanca",
  "Murcia",
];

export const CATEGORIES: {
  id: LeadType;
  label: string;
  icon: string;
  desc: string;
  placeholder: string;
  searchPrefix: string;
}[] = [
  {
    id: "sala",
    label: "Sala / Teatro",
    icon: "🏛️",
    desc: "Salas de conciertos, directos y teatros con programación regular",
    placeholder: "Ej. salas rock, cafés concierto, teatros...",
    searchPrefix: "Salas de conciertos y recintos con música en directo",
  },
  {
    id: "ayuntamiento",
    label: "Ayuntamiento / Fiestas",
    icon: "🏛️",
    desc: "Concejalías de festejos, fiestas patronales y cultura municipal",
    placeholder: "Ej. festejos, fiestas patronales, concejalía de cultura...",
    searchPrefix: "Ayuntamientos, concejalías de festejos y fiestas patronales",
  },
  {
    id: "festival",
    label: "Festival / Feria",
    icon: "🎪",
    desc: "Festivales de música, ferias de cerveza o eventos con conciertos en vivo",
    placeholder:
      "Ej. festivales indie, ferias de cerveza, fiestas gastronómicas...",
    searchPrefix: "Festivales de música y ferias con conciertos en directo",
  },
  {
    id: "discoteca",
    label: "Discoteca / Club",
    icon: "🪩",
    desc: "Clubs nocturnos y salas de baile con sesiones o directo",
    placeholder: "Ej. clubs música electrónica, salas de baile, DJs...",
    searchPrefix: "Clubs nocturnos y discotecas con música en directo o DJs",
  },
  {
    id: "grupo",
    label: "Grupo / Banda",
    icon: "🎸",
    desc: "Bandas y grupos de música afines para bolos conjuntos, giras o intercambio",
    placeholder:
      "Ej. bandas de rock, grupos indie, bandas locales en activo...",
    searchPrefix: "Grupos y bandas de música en activo",
  },
  {
    id: "agencia",
    label: "Agencia / Booking",
    icon: "💼",
    desc: "Agencias de contratación, managers y promotores musicales",
    placeholder: "Ej. agencias de contratación artística, management...",
    searchPrefix: "Agencias de booking musical y management de bandas",
  },
  {
    id: "sello",
    label: "Sello Discográfico",
    icon: "💿",
    desc: "Discográficas y distribuidoras independientes",
    placeholder: "Ej. sellos independientes, discográficas rock/pop/urban...",
    searchPrefix: "Sellos discográficos y editoriales de música independiente",
  },
  {
    id: "medio",
    label: "Medio / Radio",
    icon: "📻",
    desc: "Radios, podcasts, fanzines y prensa especializada",
    placeholder: "Ej. emisoras de radio, programas musicales, fanzines...",
    searchPrefix: "Medios de comunicación musical, programas de radio y prensa",
  },
];

