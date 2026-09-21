import { Concert, Lead } from '../types';

// Clusters y corredores logísticos de gira en España
export interface ProvinceCorridor {
  corridor: string;
  provinces: string[];
  neighboringCorridors: string[];
}

export const SPANISH_TOUR_CORRIDORS: Record<string, ProvinceCorridor> = {
  mediterraneo: {
    corridor: 'Eje Mediterráneo',
    provinces: ['barcelona', 'tarragona', 'girona', 'lleida', 'castellón', 'castellon', 'valencia', 'valència', 'alicante', 'alacant', 'murcia', 'baleares', 'palma'],
    neighboringCorridors: ['ebro', 'centro']
  },
  centro: {
    corridor: 'Eje Centro & Meseta',
    provinces: ['madrid', 'toledo', 'guadalajara', 'segovia', 'ávila', 'avila', 'cuenca', 'ciudad real'],
    neighboringCorridors: ['castilla', 'mediterraneo', 'sur']
  },
  ebro_norte: {
    corridor: 'Eje del Ebro & Norte',
    provinces: ['zaragoza', 'huesca', 'teruel', 'la rioja', 'logroño', 'navarra', 'pamplona', 'álava', 'alava', 'vitoria', 'guipúzcoa', 'guipuzcoa', 'san sebastián', 'donostia', 'vizcaya', 'bilbao'],
    neighboringCorridors: ['mediterraneo', 'cantabrico', 'castilla']
  },
  cantabrico_noroeste: {
    corridor: 'Eje Cantábrico & Noroeste',
    provinces: ['cantabria', 'santander', 'asturias', 'oviedo', 'gijón', 'gijon', 'a coruña', 'coruña', 'pontevedra', 'vigo', 'lugo', 'ourense'],
    neighboringCorridors: ['ebro_norte', 'castilla']
  },
  castilla_leon: {
    corridor: 'Eje Castilla y León',
    provinces: ['valladolid', 'salamanca', 'burgos', 'león', 'leon', 'palencia', 'zamora', 'soria'],
    neighboringCorridors: ['centro', 'cantabrico_noroeste', 'ebro_norte']
  },
  sur_andalucia: {
    corridor: 'Eje Sur & Andalucía',
    provinces: ['sevilla', 'málaga', 'malaga', 'granada', 'córdoba', 'cordoba', 'cádiz', 'cadiz', 'huelva', 'jaén', 'jaen', 'almería', 'almeria', 'badajoz', 'cáceres', 'caceres'],
    neighboringCorridors: ['centro']
  }
};

/**
 * Normaliza nombres de ciudades/provincias para comparación flexible
 */
export function normalizeLocationName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Encuentra el corredor logístico al que pertenece una ciudad o provincia
 */
export function findCorridorForCity(cityOrRegion?: string): { key: string; info: ProvinceCorridor } | null {
  const norm = normalizeLocationName(cityOrRegion);
  if (!norm) return null;

  for (const [key, info] of Object.entries(SPANISH_TOUR_CORRIDORS)) {
    const matches = info.provinces.some(p => {
      const normP = normalizeLocationName(p);
      return norm.includes(normP) || normP.includes(norm);
    });
    if (matches) {
      return { key, info };
    }
  }
  return null;
}

/**
 * Evalúa si dos ciudades pertenecen al mismo corredor logístico o a corredores vecinos
 */
export function areCitiesLogisticallyCompatible(cityA?: string, cityB?: string): boolean {
  if (!cityA || !cityB) return false;
  const normA = normalizeLocationName(cityA);
  const normB = normalizeLocationName(cityB);
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  const corridorA = findCorridorForCity(cityA);
  const corridorB = findCorridorForCity(cityB);

  if (!corridorA || !corridorB) return false;

  // Mismo corredor
  if (corridorA.key === corridorB.key) return true;

  // Corredores limítrofes directos
  return corridorA.info.neighboringCorridors.includes(corridorB.key);
}

export interface TourRoutingOpportunity {
  confirmedConcert: Concert;
  concertDateStr: string;
  concertCity: string;
  corridorName: string;
  candidateLeads: Lead[];
  suggestedAction: string;
  potentialWeekendDates: string[];
}

/**
 * Encuentra oportunidades de clúster logístico para optimizar giras:
 * Si hay un concierto confirmado en la ciudad X en fecha Y, busca leads en el CRM
 * en ciudades limítrofes / mismo corredor que estén pendientes de confirmación.
 */
export function findTourRoutingOpportunities(
  concerts: Concert[],
  leads: Lead[]
): TourRoutingOpportunity[] {
  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  // Filtrar conciertos confirmados en los próximos 90 días
  const upcomingConfirmed = concerts.filter(c => {
    if (!c.fecha) return false;
    const cDate = new Date(c.fecha);
    const isValidDate = !isNaN(cDate.getTime());
    const isFuture = cDate >= now && cDate <= ninetyDaysFromNow;
    const isConfirmed = c.tipo !== 'posible' && !c.is_posible;
    return isValidDate && isFuture && isConfirmed;
  });

  const opportunities: TourRoutingOpportunity[] = [];

  for (const concert of upcomingConfirmed) {
    const concertCity = concert.ciudad || concert.direccion || '';
    const corridorData = findCorridorForCity(concertCity);
    if (!corridorData) continue;

    // Calcular fechas del fin de semana objetivo (día previo, día siguiente)
    const concertDate = new Date(concert.fecha);
    const prevDay = new Date(concertDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const nextDay = new Date(concertDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const potentialWeekendDates = [
      prevDay.toISOString().split('T')[0],
      concert.fecha.split('T')[0],
      nextDay.toISOString().split('T')[0]
    ];

    // Buscar leads en el CRM del mismo corredor o compatibles
    const compatibleLeads = leads.filter(l => {
      // Ignorar confirmados o aplazados
      const status = (l.estado || '').toLowerCase();
      if (status === 'confirmado' || status === 'no_interesado' || status === 'descartado') {
        return false;
      }

      // Debe estar en una ciudad compatible
      const leadCity = l.ciudad || l.region || '';
      return areCitiesLogisticallyCompatible(concertCity, leadCity);
    });

    if (compatibleLeads.length > 0) {
      // Priorizar los de estado más avanzado (negociando > respondiendo > esperando_respuesta > nuevo)
      const sortedLeads = [...compatibleLeads].sort((a, b) => {
        const priorityScore: Record<string, number> = {
          negociando: 4,
          respondido: 3,
          interesado: 3,
          esperando_respuesta: 2,
          contactado: 2,
          nuevo: 1
        };
        return (priorityScore[b.estado] || 0) - (priorityScore[a.estado] || 0);
      });

      const topCandidates = sortedLeads.slice(0, 5);
      const cities = Array.from(new Set(topCandidates.map(l => l.ciudad).filter(Boolean)));

      opportunities.push({
        confirmedConcert: concert,
        concertDateStr: concert.fecha.split('T')[0],
        concertCity,
        corridorName: corridorData.info.corridor,
        candidateLeads: topCandidates,
        suggestedAction: `Tienes bolo en ${concertCity} el ${concert.fecha.split('T')[0]}. Contacta a salas en ${cities.slice(0, 3).join(', ')} para completar el fin de semana.`,
        potentialWeekendDates
      });
    }
  }

  return opportunities;
}

export interface LeadScoreBreakdown {
  total: number;
  tier: 'VIP' | 'Alta Prioridad' | 'Oportunidad' | 'Estándar';
  genreAffinity: number;     // 0 a 25
  contactQuality: number;    // 0 a 25
  venueReadiness: number;    // 0 a 20
  crmMomentum: number;       // 0 a 15
  tourSynergy: number;       // 0 a 15
  reasons: string[];
}

/**
 * Calcula un Lead Score objetivo (0 a 100) para priorizar contactos en el CRM
 */
export function calculateLeadScore(
  lead: Lead,
  options?: {
    bandGenre?: string;
    upcomingConcerts?: Concert[];
  }
): LeadScoreBreakdown {
  const reasons: string[] = [];

  // 1. AFINIDAD DE GÉNERO (0 a 25)
  let genreAffinity = 10; // Base estándar
  const bandGenreNorm = normalizeLocationName(options?.bandGenre || 'indie rock fusion');
  const leadGenreNorm = normalizeLocationName(lead.genero || '');

  if (leadGenreNorm) {
    const bandWords = bandGenreNorm.split(' ');
    const hasOverlap = bandWords.some(w => w.length > 3 && leadGenreNorm.includes(w));
    if (hasOverlap) {
      genreAffinity = 25;
      reasons.push('Alta afinidad con el género musical de la banda');
    } else {
      genreAffinity = 15;
    }
  }

  // 2. CALIDAD DE CONTACTO DIRECTO (0 a 25)
  let contactQuality = 5;
  if (lead.email_contacto && lead.email_contacto.includes('@')) {
    contactQuality += 10;
  }
  if (lead.contacto_nombre && lead.contacto_nombre.trim().length > 2) {
    contactQuality += 5;
    reasons.push(`Contacto con programador nombrado: ${lead.contacto_nombre}`);
  }
  if (lead.telefono || lead.instagram) {
    contactQuality += 5;
  }

  // 3. CAPACIDAD Y CONDICIONES DE SALA (0 a 20)
  let venueReadiness = 10;
  if (lead.aforo && lead.aforo >= 80 && lead.aforo <= 800) {
    venueReadiness = 20; // Aforo ideal para circuito independiente
    reasons.push(`Aforo óptimo para venta y amortización (${lead.aforo} personas)`);
  } else if (lead.aforo && lead.aforo > 800) {
    venueReadiness = 15;
  } else if (lead.tipo === 'festival' || lead.tipo === 'ayuntamiento') {
    venueReadiness = 18;
  }

  // 4. MOMENTUM Y ESTADO CRM (0 a 15)
  let crmMomentum = 5;
  const status = (lead.estado || '').toLowerCase();
  if (status === 'negociando') {
    crmMomentum = 15;
    reasons.push('Negociación activa en curso');
  } else if (status === 'interesado' || status === 'respondido') {
    crmMomentum = 13;
    reasons.push('Sala con respuesta receptiva');
  } else if (status === 'esperando_respuesta' || status === 'contactado') {
    crmMomentum = 8;
  } else if (status === 'nuevo') {
    crmMomentum = 5;
  }

  // 5. SINERGIA DE GIRA Y LOGÍSTICA (0 a 15)
  let tourSynergy = 0;
  if (options?.upcomingConcerts && options.upcomingConcerts.length > 0) {
    const leadCity = lead.ciudad || lead.region;
    const hasSynergy = options.upcomingConcerts.some(c => 
      areCitiesLogisticallyCompatible(c.ciudad, leadCity)
    );
    if (hasSynergy) {
      tourSynergy = 15;
      reasons.push('Sinergia geográfica con bolo ya confirmado');
    }
  }

  const total = Math.min(100, Math.round(genreAffinity + contactQuality + venueReadiness + crmMomentum + tourSynergy));

  let tier: LeadScoreBreakdown['tier'] = 'Estándar';
  if (total >= 80) tier = 'VIP';
  else if (total >= 65) tier = 'Alta Prioridad';
  else if (total >= 50) tier = 'Oportunidad';

  return {
    total,
    tier,
    genreAffinity,
    contactQuality,
    venueReadiness,
    crmMomentum,
    tourSynergy,
    reasons
  };
}
