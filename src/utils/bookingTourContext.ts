import { Concert, Lead } from '../types';
import { areCitiesLogisticallyCompatible } from './tourRouting';

export interface BandDateAvailability {
  status: 'libre' | 'conflicto_directo' | 'cercano_compatible' | 'cercano_aviso';
  mensaje: string;
  conciertoConflicto?: Concert;
  conciertoCercano?: Concert;
  diasDiferencia?: number;
}

export interface CityPerformanceHistory {
  ciudad: string;
  totalConciertos: number;
  ultimoConcierto?: Concert;
  mejorAforo?: number;
  salaMejorAforo?: string;
  resumenTexto: string;
  pitchSnippet: string;
}

export type CommercialDealType = 'taquilla_100' | 'garantia_porcentaje' | 'cache_fijo';

export interface CommercialDealSnippet {
  id: CommercialDealType;
  label: string;
  badge: string;
  descripcionCorta: string;
  textoCompleto: string;
}

/**
 * Normaliza nombres de ciudades para comparación flexible (Madrid, BCN, Barbate (Cádiz)...)
 */
export function normalizeCityName(cityName?: string): string {
  if (!cityName) return '';
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

/**
 * Evalúa si hay conflicto de fechas o proximidad de gira con los conciertos confirmados de la banda
 */
export function checkBandDateConflict(
  targetDateStr: string | undefined,
  concerts: Concert[] = [],
  venueCity?: string
): BandDateAvailability {
  if (!targetDateStr || !concerts || concerts.length === 0) {
    return {
      status: 'libre',
      mensaje: '🟢 Agenda despejada'
    };
  }

  // Extraer año-mes-día limpio
  const cleanTargetDate = targetDateStr.trim().slice(0, 10);
  const targetTimestamp = new Date(cleanTargetDate).getTime();

  if (isNaN(targetTimestamp)) {
    return {
      status: 'libre',
      mensaje: '🟢 Sin restricciones de fecha'
    };
  }

  // 1. Detección de conflicto directo el mismo día
  const directo = concerts.find(c => {
    if (!c.fecha) return false;
    const cDate = c.fecha.trim().slice(0, 10);
    return cDate === cleanTargetDate;
  });

  if (directo) {
    return {
      status: 'conflicto_directo',
      mensaje: `🔴 Conflicto directo: Ya tocáis el ${cleanTargetDate} en ${directo.sala} (${directo.ciudad})`,
      conciertoConflicto: directo
    };
  }

  // 2. Detección de concierto en fin de semana cercano (+/- 2 días)
  let conciertoCercano: Concert | undefined;
  let minDiffDays = 999;

  for (const c of concerts) {
    if (!c.fecha) continue;
    const cTime = new Date(c.fecha.trim().slice(0, 10)).getTime();
    if (isNaN(cTime)) continue;
    const diffDays = Math.round(Math.abs(targetTimestamp - cTime) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1 && diffDays <= 2 && diffDays < minDiffDays) {
      minDiffDays = diffDays;
      conciertoCercano = c;
    }
  }

  if (conciertoCercano) {
    const compatible = venueCity && areCitiesLogisticallyCompatible(venueCity, conciertoCercano.ciudad);
    const relacionTemporal = new Date(conciertoCercano.fecha).getTime() < targetTimestamp ? 'el día antes' : 'el día después';

    if (compatible) {
      return {
        status: 'cercano_compatible',
        mensaje: `🚗 Enlace en ruta: Tocáis ${relacionTemporal} en ${conciertoCercano.ciudad} (${conciertoCercano.sala}). ¡Ideal para fin de semana doble!`,
        conciertoCercano,
        diasDiferencia: minDiffDays
      };
    } else {
      return {
        status: 'cercano_aviso',
        mensaje: `⚠️ Ojo de ruta: Tocáis ${relacionTemporal} en ${conciertoCercano.ciudad} (${conciertoCercano.sala}). Revisar distancia.`,
        conciertoCercano,
        diasDiferencia: minDiffDays
      };
    }
  }

  return {
    status: 'libre',
    mensaje: '🟢 Fin de semana 100% libre para la banda'
  };
}

/**
 * Consulta el historial de conciertos de la banda en la ciudad de la sala
 */
export function getCityTourHistory(
  venueCity: string | undefined,
  concerts: Concert[] = []
): CityPerformanceHistory | null {
  if (!venueCity || !concerts || concerts.length === 0) return null;

  const targetCityNorm = normalizeCityName(venueCity);
  if (!targetCityNorm || targetCityNorm.length < 3) return null;

  const cityConcerts = concerts.filter(c => {
    if (!c.ciudad) return false;
    const cCityNorm = normalizeCityName(c.ciudad);
    return (
      cCityNorm === targetCityNorm ||
      cCityNorm.includes(targetCityNorm) ||
      targetCityNorm.includes(cCityNorm)
    );
  });

  if (cityConcerts.length === 0) return null;

  // Ordenar por fecha descendente (el más reciente primero)
  const sorted = [...cityConcerts].sort((a, b) => {
    return new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime();
  });

  const ultimoConcierto = sorted[0];
  let mejorAforo = 0;
  let salaMejorAforo = '';

  for (const c of sorted) {
    const aforo = c.aforo_vendido || c.asistencia_propia || 0;
    if (aforo > mejorAforo) {
      mejorAforo = aforo;
      salaMejorAforo = c.sala;
    }
  }

  const entradasUltimo = ultimoConcierto.aforo_vendido || ultimoConcierto.asistencia_propia;
  const resumenTexto = entradasUltimo
    ? `${sorted.length} ${sorted.length === 1 ? 'bolo previo' : 'bolos previos'} en ${venueCity} (Último: ${entradasUltimo} personas en ${ultimoConcierto.sala})`
    : `${sorted.length} ${sorted.length === 1 ? 'bolo previo' : 'bolos previos'} en ${venueCity} (${ultimoConcierto.sala})`;

  const pitchSnippet = entradasUltimo
    ? `En nuestra última fecha en ${venueCity} reunimos a más de ${entradasUltimo} personas en ${ultimoConcierto.sala} con un gran ambiente y consumo en barra.`
    : `Ya hemos presentado nuestro directo en ${venueCity} con excelente acogida en ${ultimoConcierto.sala}.`;

  return {
    ciudad: venueCity,
    totalConciertos: sorted.length,
    ultimoConcierto,
    mejorAforo,
    salaMejorAforo,
    resumenTexto,
    pitchSnippet
  };
}

/**
 * Snippets comerciales de rápida inserción para negociación de fechas
 */
export function getCommercialDealSnippets(
  bandName: string = 'Bakandeya',
  lead?: Partial<Lead>
): CommercialDealSnippet[] {
  const precioAnticipada = lead?.financial_break_even?.precio_entrada_anticipada || 12;
  const precioTaquilla = lead?.financial_break_even?.precio_entrada_taquilla || 15;
  const cacheEstimado = lead?.financial_break_even?.beneficio_estimado_lleno 
    ? Math.max(500, Math.round(lead.financial_break_even.beneficio_estimado_lleno * 0.6))
    : 800;

  return [
    {
      id: 'taquilla_100',
      label: '🎟️ 100% Taquilla',
      badge: 'Riesgo 0 para sala',
      descripcionCorta: `Taquilla íntegra (${precioAnticipada}€ ant. / ${precioTaquilla}€ taq.) asumiendo la banda el riesgo y promo.`,
      textoCompleto: `Nuestra propuesta principal es ir al 100% de la taquilla para la banda con una entrada fijada en ${precioAnticipada}€ anticipada y ${precioTaquilla}€ en taquilla. Nosotros asumimos el riesgo de taquilla y la campaña de comunicación local. Por vuestra parte solo requeriríamos el equipamiento de sonido de la sala con vuestro técnico de PA y el personal habitual de barra.`
    },
    {
      id: 'garantia_porcentaje',
      label: '⚖️ Garantía 300€ + 70%',
      badge: 'Fórmula Equilibrada',
      descripcionCorta: '300€ fijos para gastos de furgoneta/viaje + 70% de la taquilla neta.',
      textoCompleto: `Para asegurar los costes de desplazamiento de la banda desde nuestra base, os proponemos una garantía mínima de 300€ fijos más el 70% de la taquilla neta generada a partir de cubrir los costes directos. Pondríamos las entradas a ${precioAnticipada}€ anticipada para llenar la sala desde semanas antes.`
    },
    {
      id: 'cache_fijo',
      label: `💼 Caché Fijo (${cacheEstimado}€)`,
      badge: 'Caché cerrado',
      descripcionCorta: `${cacheEstimado}€ + IVA cerrado, directo completo de 90 min y cena/catering para músicos.`,
      textoCompleto: `Nuestras condiciones para esta fecha en formato caché cerrado son de ${cacheEstimado}€ + IVA, ofreciendo un directo enérgico de 90 minutos de ${bandName} con violín, percusión y bases electrónicas, requiriendo únicamente cena o dieta básica para los músicos y técnico.`
    }
  ];
}
