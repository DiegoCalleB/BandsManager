import { Lead, LeadStatus, LeadType } from '../types';

export interface BookingMetrics {
  totalLeads: number;
  leadsPorEstado: Record<string, number>;
  tasaRespuesta: number;
  tasaConversion: number;
  aforoTotalPotencial: number;
  aforoPromedio: number;
}

// Helper to normalize status strings from UI / DB to Option A canonical states
export const normalizeStatus = (s: any): LeadStatus => {
  if (!s) return 'nuevo';
  const str = String(s).trim().toLowerCase();
  if (str.includes('confirm') || str.includes('cerrad') || str === 'concierto_confirmado' || str === 'bolo_cerrado') return 'confirmado';
  if (str.includes('aplaz') || str.includes('pospuest') || str.includes('recontact') || str === 'otra_temporada') return 'aplazado';
  if (str.includes('negocia') || str.includes('trato')) return 'negociando';
  if (str === 'respondido' || str.includes('convers') || str.includes('respond')) return 'respondido';
  if (str.includes('interesado') && !str.includes('no')) return 'negociando';
  if (str.includes('enviado') || str.includes('contactad') || str === 'esperando_respuesta' || str.includes('esperando') || str === 'contactado') return 'esperando_respuesta';
  if (str.includes('no') || str === 'no_interesado' || str.includes('rechaz') || str.includes('descart')) return 'no_interesado';
  // Borrador ya creado en la bandeja de la banda por el Agente Enviador en modo 'draft': el
  // pitch está aprobado y escrito, pero NO se ha enviado nada todavía. Distinto de
  // 'pendiente_aprobacion' (pitch aún sin aprobar) y de 'aprobado' (en cola de envío).
  if (str === 'borrador_creado' || str.includes('borrador_cre')) return 'borrador_creado';
  if (str === 'pendiente_aprobacion' || str.includes('por_aprobar') || str === 'pendiente') return 'pendiente_aprobacion';
  if (str === 'aprobado_propuesta' || str.includes('aprobado_pitch')) return 'aprobado_propuesta';
  if (str === 'aprobado_respuesta' || str.includes('aprobado_resp')) return 'aprobado_respuesta';
  if (str === 'aprobado' || str.includes('listo') || str === 'aprobados') return 'aprobado';
  return 'nuevo';
};

// Helper to normalize lead types
export const normalizeType = (t: any): LeadType => {
  if (!t) return 'sala';
  const s = String(t).trim().toLowerCase();
  if (s.includes('festiv') || s === 'festival') return 'festival';
  if (s.includes('ayunt') || s.includes('fiesta') || s.includes('municip') || s === 'ayuntamiento') return 'ayuntamiento';
  if (s.includes('disco') || s.includes('club') || s.includes('nightclub') || s === 'discoteca') return 'discoteca';
  if (s.includes('agenc') || s === 'agencia') return 'agencia';
  if (s.includes('manag') || s === 'manager') return 'manager';
  if (s.includes('sello') || s.includes('discog') || s === 'sello') return 'sello';
  if (s.includes('grup') || s.includes('artist') || s.includes('banda') || s === 'grupo') return 'grupo';
  if (s.includes('product') || s === 'productora') return 'productora';
  if (s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc') || s === 'medio') return 'medio';
  return 'sala';
};

// Known Spanish venues address database for intelligent address enrichment
export const VENUE_ADDRESS_DATABASE: Record<string, string> = {
  'sala trinchera': 'Calle Parauta, 25, 29006 Málaga',
  'trinchera': 'Calle Parauta, 25, 29006 Málaga',
  'sala apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
  'apolo': 'Carrer de Nou de la Rambla, 113, 08004 Barcelona',
  'ochoymedio club': 'Calle de Barceló, 11, 28004 Madrid',
  'ochoymedio': 'Calle de Barceló, 11, 28004 Madrid',
  'sala el tren': 'Carretera de Málaga, 136, 18015 Granada',
  'el tren': 'Carretera de Málaga, 136, 18015 Granada',
  'sala razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
  'razzmatazz': 'Carrer dels Almogàvers, 122, 08018 Barcelona',
  'kafe antzokia': 'San Vicente Kalea, 2, 48001 Bilbo, Bizkaia',
  'sala capitol': 'Rúa de Concepción Arenal, 5, 15702 Santiago de Compostela',
  'sala rem': 'Calle Puerta Nueva, 33, 30001 Murcia',
  'sala custom': 'Calle Metalurgia, 25, 41007 Sevilla',
  'sala villanos': 'Calle Bernardino Obregón, 18, 28012 Madrid',
  'sala hebe': 'Calle Tomás Esteban, 28, 28018 Madrid',
  'sala caracol': 'Calle Bernardino Obregón, 18, 28012 Madrid',
  'industrial copera': 'Calle Desmond Tutu, 18151 La Zulka, Granada',
  'garaje beat club': 'Avenida Miguel de Cervantes, 45, 30009 Murcia',
  'dabadaba': 'Mundaiz Kalea, 8, 20012 Donostia, Gipuzkoa',
  'sala moon': 'Carrer de San Vicente Mártir, 200, 46007 València',
  'paris 15': 'Calle Calle La Orotava, 27, 29006 Málaga',
  'joy eslava': 'Calle Arenal, 11, 28013 Madrid',
  'moby dick club': 'Avenida de Brasil, 5, 28020 Madrid',
  'viña rock': 'Recinto Ferial, 02600 Villarrobledo, Albacete',
  'cabo de plata': 'Playa de la Hierbabuena, 11160 Barbate, Cádiz',
  'distrito 921': 'Plaza de San Martín, 4, 40001 Segovia',
  '921 distrito musical': 'Plaza de San Martín, 4, 40001 Segovia',
  'fundación don juan de borbón': 'Plaza de San Martín, 4, 40001 Segovia'
};

export function autoDetectVenueAddress(nombreSala: string, ciudad: string): string {
  if (!nombreSala) return '';
  const cleanName = nombreSala.toLowerCase().trim();
  for (const [key, addr] of Object.entries(VENUE_ADDRESS_DATABASE)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return addr;
    }
  }
  return '';
}

/**
 * Calculates metrics and stats for the booking sales pipeline
 */
export function calculateBookingMetrics(leads: Lead[]): BookingMetrics {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return {
      totalLeads: 0,
      leadsPorEstado: {},
      tasaRespuesta: 0,
      tasaConversion: 0,
      aforoTotalPotencial: 0,
      aforoPromedio: 0,
    };
  }

  const leadsPorEstado: Record<string, number> = {};
  let sumAforo = 0;
  let respondedCount = 0;
  let convertedCount = 0;

  for (const lead of leads) {
    const estado = lead.estado || 'nuevo';
    const norm = normalizeStatus(estado);
    leadsPorEstado[estado] = (leadsPorEstado[estado] || 0) + 1;
    // Solo sumar también bajo la clave normalizada si es distinta de la cruda;
    // si no, un lead con estado exactamente 'aprobado' se contaba 2-3 veces
    // bajo la misma clave (raw + norm + el rollup de abajo), inflando la
    // tarjeta "Aprobados" del dashboard (BookingMetricsCards.tsx).
    if (norm !== estado) {
      leadsPorEstado[norm] = (leadsPorEstado[norm] || 0) + 1;
    }
    if (estado.startsWith('aprobado') && estado !== 'aprobado') {
      leadsPorEstado['aprobado'] = (leadsPorEstado['aprobado'] || 0) + 1;
    }
    sumAforo += lead.aforo || 0;

    if (['negociando', 'respondido', 'no_interesado', 'confirmado', 'aplazado'].includes(norm) || lead.fecha_ultima_respuesta) {
      respondedCount++;
    }

    if (norm === 'confirmado' || norm === 'negociando' || estado.startsWith('aprobado')) {
      convertedCount++;
    }
  }

  const tasaRespuesta = Number(((respondedCount / totalLeads) * 100).toFixed(1));
  const tasaConversion = Number(((convertedCount / totalLeads) * 100).toFixed(1));
  const aforoPromedio = Math.round(sumAforo / totalLeads);

  return {
    totalLeads,
    leadsPorEstado,
    tasaRespuesta,
    tasaConversion,
    aforoTotalPotencial: sumAforo,
    aforoPromedio,
  };
}

/**
 * Filters leads by text search query, status, and category type
 */
export function filterLeads(
  leads: Lead[],
  searchQuery: string = '',
  statusFilter: string = 'todos',
  typeFilter: string = 'todos'
): Lead[] {
  const query = searchQuery.toLowerCase().trim();

  return leads.filter((lead) => {
    const matchesSearch =
      !query ||
      lead.nombre_sala.toLowerCase().includes(query) ||
      lead.ciudad.toLowerCase().includes(query) ||
      (lead.contacto_nombre && lead.contacto_nombre.toLowerCase().includes(query)) ||
      (lead.email_contacto && lead.email_contacto.toLowerCase().includes(query));

    const normStatus = normalizeStatus(lead.estado);
    const matchesStatus = statusFilter === 'todos' || normStatus === statusFilter || lead.estado === statusFilter;
    const matchesType = typeFilter === 'todos' || lead.tipo === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
}

/**
 * Computes a quality score (0-100) for a lead based on venue data richness
 */
export function calculateLeadScore(lead: Lead): number {
  let score = 30; // base score

  if (lead.email_contacto) score += 15;
  if (lead.telefono) score += 10;
  if (lead.contacto_nombre) score += 10;
  if (lead.instagram) score += 10;
  if (lead.website) score += 5;
  if (lead.aforo > 100) score += 10;
  if (lead.hilo_emails && lead.hilo_emails.length > 0) score += 10;

  return Math.min(100, score);
}
