// Validación y normalización de los recintos que devuelve la IA en el Agente Scout.
//
// Existe por un fallo concreto: antes, si la IA no respondía o devolvía basura, el Scout
// FABRICABA una sala ("Sala Directo & Conciertos {ciudad}") con email y teléfono inventados y la
// insertaba en Supabase en estado 'nuevo'. De ahí el Redactor le escribía un pitch real y podía
// acabar en un correo a una dirección que no existe.
//
// La regla es simple y no se negocia: un hueco vacío es correcto, un dato inventado no.

export interface LeadDescubierto {
  nombre_sala: string;
  ciudad: string;
  region: string;
  aforo: number;
  genero: string;
  tipo: string;
  email_contacto: string;
  telefono: string;
  instagram: string;
  website: string;
  notas: string;
  corredor_gira?: string;
  tier_aforo?: "intimo" | "medio" | "grande" | "macro";
  afinidad_musical?: number;
}

/**
 * Determina el corredor de gira / ruta geográfica según la ciudad o región.
 * Permite a las bandas agrupar fechas contiguas para armar fines de semana de gira eficientes.
 */
export function determinarCorredorGira(ciudad: string, region: string): string {
  const loc = `${ciudad || ""} ${region || ""}`.toLowerCase();

  if (/\b(sevilla|cádiz|cadiz|málaga|malaga|granada|córdoba|cordoba|huelva|jaén|jaen|almería|almeria|jerez|marbella|algeciras|tarifa)\b/i.test(loc)) {
    return "Ruta Sur (Andalucía)";
  }
  if (/\b(badajoz|cáceres|caceres|mérida|merida|plasencia|extremadura)\b/i.test(loc)) {
    return "Ruta Suroeste (Extremadura)";
  }
  if (/\b(barcelona|valencia|alicante|castellón|castellon|murcia|girona|gerona|tarragona|lleida|elche|cartagena|palma|mallorca|menorca|ibiza|baleares)\b/i.test(loc)) {
    return "Corredor Mediterráneo";
  }
  if (/\b(madrid|toledo|guadalajara|cuenca|ciudad real|albacete|segovia|ávila|avila|salamanca)\b/i.test(loc)) {
    return "Eje Central (Madrid / Castillas)";
  }
  if (/\b(bilbao|bizkaia|vizcaya|donostia|san sebastián|san sebastian|gipuzkoa|guipúzcoa|vitoria|gasteiz|álava|alava|pamplona|navarra|santander|cantabria|oviedo|gijón|gijon|asturias|coruña|a coruña|vigo|pontevedra|santiago|ourense|lugo|galicia|logroño|rioja)\b/i.test(loc)) {
    return "Ruta Norte / Cantábrico";
  }
  if (/\b(zaragoza|huesca|teruel|aragón|aragon|soria|burgos|valladolid|palencia|león|leon|zamora)\b/i.test(loc)) {
    return "Eje Valle del Ebro / Interior";
  }
  if (/\b(tenerife|las palmas|gran canaria|lanzarote|fuerteventura|canarias)\b/i.test(loc)) {
    return "Islas Canarias";
  }
  if (/\b(lisboa|porto|porto|coimbra|faro|portugal|francia|italia|alemania|londres|uk|reino unido)\b/i.test(loc)) {
    return "Internacional / Europa";
  }
  return "Nacional / Multiruta";
}

/**
 * Clasifica el aforo en niveles estándar de la industria para calibrar el caché y producción.
 */
export function clasificarAforoRecinto(aforo: number, tipo: string): "intimo" | "medio" | "grande" | "macro" {
  const normTipo = (tipo || "").toLowerCase();
  if (normTipo === "festival" || aforo > 1500) return "macro";
  if (aforo > 500) return "grande";
  if (aforo >= 150) return "medio";
  return "intimo";
}

/**
 * Calcula una puntuación de afinidad musical (0 a 100) entre la programación del recinto y el estilo de la banda.
 */
export function calcularAfinidadMusical(generoRecinto: string, generoBanda: string): number {
  if (!generoRecinto || !generoBanda) return 75;

  const r = generoRecinto.toLowerCase();
  const b = generoBanda.toLowerCase();

  if (r.includes(b) || b.includes(r)) return 95;

  const gruposGeneros: string[][] = [
    ["rock", "indie", "alternativo", "post-punk", "grunge", "punk", "garage"],
    ["mestizaje", "ska", "reggae", "balkan", "fusión", "fusion", "cumbia", "world music", "pachanga"],
    ["pop", "indie-pop", "canción de autor", "acústico", "folk", "americana"],
    ["metal", "hardcore", "heavy", "thrash", "stoner", "metalcore"],
    ["electrónica", "techno", "house", "dnb", "drum and bass", "electro", "club"],
    ["jazz", "blues", "soul", "funk", "groove", "r&b", "afrobeat"],
    ["flamenco", "rumba", "flamenco-fusión", "raíz", "copla"]
  ];

  for (const grupo of gruposGeneros) {
    const coincideRecinto = grupo.some(g => r.includes(g));
    const coincideBanda = grupo.some(g => b.includes(g));
    if (coincideRecinto && coincideBanda) return 90;
  }

  return 70;
}

/** Valores de relleno que los modelos sueltan cuando no saben el dato. Nunca se guardan. */
const RELLENOS = [
  'booking@sala.com', 'info@sala.com', 'email@example.com', 'ejemplo@ejemplo.com',
  '+34 900 000 000', '+34 912 34 56 78', '900000000', '000000000',
  'https://sala.com', 'http://sala.com', '@sala_oficial', 'n/a', 'na', 'null',
  'desconocido', 'no disponible', 'nombre de la sala',
];

function esRelleno(valor: unknown): boolean {
  if (typeof valor !== 'string') return true;
  const v = valor.trim().toLowerCase();
  if (!v) return true;
  return RELLENOS.includes(v);
}

/** Limpia un campo de contacto: si es relleno o va vacío, devuelve "" en vez de inventar. */
export function limpiarCampoContacto(valor: unknown): string {
  return esRelleno(valor) ? '' : String(valor).trim();
}

/**
 * Un recinto solo vale si tiene un nombre propio de verdad. Sin nombre no hay nada que
 * verificar después, así que se descarta en vez de guardarlo "por si acaso".
 */
export function esLeadDescubiertoValido(bruto: any): boolean {
  if (!bruto || typeof bruto !== 'object') return false;
  const nombre = bruto.nombre_sala;
  if (typeof nombre !== 'string') return false;
  const limpio = nombre.trim();
  if (limpio.length < 2) return false;
  return !esRelleno(limpio);
}

/**
 * Pasa un recinto tal y como lo devolvió la IA a la forma que se guarda. No rellena huecos:
 * lo que la IA no supo se queda vacío (o el aforo a 0) para que el enriquecimiento posterior o
 * una persona lo completen con un dato real.
 */
export function normalizarLeadDescubierto(bruto: any, ciudadPorDefecto: string, tipoPorDefecto: string): LeadDescubierto {
  const aforo = Number(bruto?.aforo);
  return {
    nombre_sala: String(bruto.nombre_sala).trim(),
    ciudad: (typeof bruto?.ciudad === 'string' && bruto.ciudad.trim()) || ciudadPorDefecto,
    region: (typeof bruto?.region === 'string' && bruto.region.trim()) || ciudadPorDefecto,
    aforo: Number.isFinite(aforo) && aforo > 0 ? aforo : 0,
    genero: (typeof bruto?.genero === 'string' && bruto.genero.trim()) || 'Música en Directo',
    tipo: (typeof bruto?.tipo === 'string' && bruto.tipo.trim()) || tipoPorDefecto,
    email_contacto: limpiarCampoContacto(bruto?.email_contacto),
    telefono: limpiarCampoContacto(bruto?.telefono),
    instagram: limpiarCampoContacto(bruto?.instagram),
    website: limpiarCampoContacto(bruto?.website),
    notas: (typeof bruto?.notas === 'string' && bruto.notas.trim()) || '',
  };
}

/** Filtra y normaliza de una vez lo que devolvió la IA. Puede devolver un array vacío: es válido. */
export function prepararLeadsDescubiertos(
  brutos: unknown,
  ciudadPorDefecto: string,
  tipoPorDefecto: string
): LeadDescubierto[] {
  if (!Array.isArray(brutos)) return [];
  return brutos
    .filter(esLeadDescubiertoValido)
    .map(b => normalizarLeadDescubierto(b, ciudadPorDefecto, tipoPorDefecto));
}
