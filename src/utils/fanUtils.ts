import { Fan } from '../types';

export interface FanMetrics {
  totalFans: number;
  consentimientoRGPDPercent: number;
  fansPorCiudad: Array<{ ciudad: string; total: number }>;
  fansPorOrigen: Array<{ origen: string; total: number }>;
}

/**
 * Calculates fan community metrics and demographics
 */
export function calculateFanEngagementMetrics(fans: Fan[]): FanMetrics {
  const totalFans = fans.length;
  if (totalFans === 0) {
    return {
      totalFans: 0,
      consentimientoRGPDPercent: 0,
      fansPorCiudad: [],
      fansPorOrigen: [],
    };
  }

  let rgpdCount = 0;
  const ciudadMap = new Map<string, number>();
  const origenMap = new Map<string, number>();

  for (const fan of fans) {
    if (fan.consentimientoRGPD) rgpdCount++;

    const ciudad = fan.ciudad && fan.ciudad.trim() ? fan.ciudad.trim() : 'Desconocida';
    ciudadMap.set(ciudad, (ciudadMap.get(ciudad) || 0) + 1);

    const origen = fan.conciertoOrigenNombre || fan.comoConocio || 'Directo / QR';
    origenMap.set(origen, (origenMap.get(origen) || 0) + 1);
  }

  const sortedCities = Array.from(ciudadMap.entries())
    .map(([ciudad, total]) => ({ ciudad, total }))
    .sort((a, b) => b.total - a.total);

  const sortedOrigins = Array.from(origenMap.entries())
    .map(([origen, total]) => ({ origen, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalFans,
    consentimientoRGPDPercent: Number(((rgpdCount / totalFans) * 100).toFixed(1)),
    fansPorCiudad: sortedCities,
    fansPorOrigen: sortedOrigins,
  };
}

/**
 * Filters fans list by query and city
 */
export function filterFans(fans: Fan[], search: string = '', city: string = 'todas'): Fan[] {
  const query = search.toLowerCase().trim();

  return fans.filter((fan) => {
    const matchesSearch =
      !query ||
      fan.nombre.toLowerCase().includes(query) ||
      fan.email.toLowerCase().includes(query) ||
      (fan.ciudad && fan.ciudad.toLowerCase().includes(query));

    const matchesCity = city === 'todas' || (fan.ciudad && fan.ciudad.toLowerCase() === city.toLowerCase());

    return matchesSearch && matchesCity;
  });
}

/**
 * Normaliza y sanea el nombre de un concierto para su visualización en el Fan Landing y componentes públicos.
 * Corrige de forma transparente erratas conocidas (por ejemplo, "Ferrera" -> "Ferrara") sin romper
 * los enlaces de códigos QR impresos o compartidos que lleven el parámetro original en la URL.
 */
export function sanitizeConcertDisplayName(rawName?: string | null): string {
  if (!rawName) return '';
  let clean = rawName.trim();

  // Corrección de erratas de ciudades/conciertos conocidas:
  // Reemplazar Ferrera por Ferrara preservando mayúsculas / minúsculas
  clean = clean.replace(/Ferrera/g, 'Ferrara');
  clean = clean.replace(/ferrera/g, 'ferrara');
  clean = clean.replace(/FERRERA/g, 'FERRARA');

  return clean;
}
