/**
 * Estimación OFFLINE de cuánto se tarda en ir de una ciudad española a otra con la furgo.
 *
 * Es deliberadamente una tabla + fórmula y no una llamada a una API o a la IA
 * (`tourLogisticsService.ts` hace eso, pero es lento, de pago y no determinista): el detector de
 * choques del calendario corre en el navegador a cada cambio y en el servidor en cada barrido,
 * y tiene que dar siempre la misma respuesta. Basta para decidir "esto no puede ser", no para
 * planificar la gira al minuto.
 *
 * Línea recta × 1,25 (carreteras) a 85 km/h de media (furgo con paradas) + 10 min de entrar y
 * salir de la ciudad. Entre islas y península no se conduce: se aplica un tiempo fijo de vuelo
 * o ferry más aeropuerto.
 */

type Zona = 'pen' | 'bal' | 'can';

interface Ciudad {
  lat: number;
  lon: number;
  zona: Zona;
  /** Isla (solo en Baleares/Canarias): dos ciudades de la misma isla se conducen. */
  isla?: string;
}

// [nombre canónico, lat, lon, zona, isla?, ...alias]
const TABLA: Array<[string, number, number, Zona, (string | undefined)?, ...string[]]> = [
  ['madrid', 40.4168, -3.7038, 'pen', undefined, 'alcala de henares', 'getafe', 'leganes', 'mostoles', 'fuenlabrada', 'alcobendas', 'rivas'],
  ['barcelona', 41.3874, 2.1686, 'pen', undefined, 'hospitalet', "l'hospitalet", 'badalona', 'sabadell', 'terrassa'],
  ['valencia', 39.4699, -0.3763, 'pen', undefined, 'valència'],
  ['sevilla', 37.3891, -5.9845, 'pen'],
  ['zaragoza', 41.6488, -0.8891, 'pen'],
  ['malaga', 36.7213, -4.4214, 'pen', undefined, 'marbella', 'torremolinos', 'fuengirola', 'benalmadena'],
  ['murcia', 37.9922, -1.1307, 'pen'],
  ['cartagena', 37.6257, -0.9966, 'pen'],
  ['bilbao', 43.263, -2.935, 'pen', undefined, 'getxo', 'barakaldo'],
  ['alicante', 38.3452, -0.481, 'pen', undefined, 'alacant', 'elche', 'benidorm', 'torrevieja'],
  ['cordoba', 37.8882, -4.7794, 'pen'],
  ['valladolid', 41.6523, -4.7245, 'pen'],
  ['vigo', 42.2406, -8.7207, 'pen'],
  ['gijon', 43.5322, -5.6611, 'pen'],
  ['oviedo', 43.3614, -5.8593, 'pen', undefined, 'aviles'],
  ['a coruna', 43.3623, -8.4115, 'pen', undefined, 'la coruna', 'coruna'],
  ['santiago de compostela', 42.8782, -8.5448, 'pen', undefined, 'santiago'],
  ['pontevedra', 42.431, -8.6444, 'pen'],
  ['ourense', 42.3358, -7.8639, 'pen', undefined, 'orense'],
  ['lugo', 43.0097, -7.5568, 'pen'],
  ['granada', 37.1773, -3.5986, 'pen'],
  ['almeria', 36.834, -2.4637, 'pen'],
  ['jaen', 37.7796, -3.7849, 'pen'],
  ['huelva', 37.2614, -6.9447, 'pen'],
  ['cadiz', 36.5271, -6.2886, 'pen', undefined, 'jerez', 'jerez de la frontera', 'algeciras'],
  ['vitoria', 42.8467, -2.6716, 'pen', undefined, 'vitoria-gasteiz', 'gasteiz'],
  ['san sebastian', 43.3183, -1.9812, 'pen', undefined, 'donostia'],
  ['pamplona', 42.8125, -1.6458, 'pen', undefined, 'iruna'],
  ['santander', 43.4623, -3.81, 'pen'],
  ['burgos', 42.3439, -3.6969, 'pen'],
  ['leon', 42.5987, -5.5671, 'pen'],
  ['salamanca', 40.9701, -5.6635, 'pen'],
  ['zamora', 41.5035, -5.744, 'pen'],
  ['palencia', 42.0096, -4.5288, 'pen'],
  ['segovia', 40.9429, -4.1088, 'pen'],
  ['avila', 40.6564, -4.6818, 'pen'],
  ['soria', 41.7664, -2.479, 'pen'],
  ['logrono', 42.4627, -2.4449, 'pen'],
  ['huesca', 42.1401, -0.4089, 'pen'],
  ['teruel', 40.3456, -1.1065, 'pen'],
  ['lleida', 41.6176, 0.62, 'pen', undefined, 'lerida'],
  ['tarragona', 41.1189, 1.2445, 'pen', undefined, 'reus'],
  ['girona', 41.9794, 2.8214, 'pen', undefined, 'gerona'],
  ['castellon', 39.9864, -0.0513, 'pen', undefined, 'castello', 'castello de la plana'],
  ['gandia', 38.968, -0.1807, 'pen'],
  ['albacete', 38.9943, -1.8585, 'pen'],
  ['cuenca', 40.0704, -2.1374, 'pen'],
  ['guadalajara', 40.6337, -3.1667, 'pen'],
  ['toledo', 39.8628, -4.0273, 'pen'],
  ['ciudad real', 38.9848, -3.9274, 'pen'],
  ['caceres', 39.4753, -6.3724, 'pen'],
  ['badajoz', 38.8794, -6.9707, 'pen'],
  ['merida', 38.9161, -6.3437, 'pen'],
  ['palma', 39.5696, 2.6502, 'bal', 'mallorca', 'palma de mallorca', 'mallorca'],
  ['ibiza', 38.9067, 1.4206, 'bal', 'ibiza', 'eivissa'],
  ['mahon', 39.8885, 4.2658, 'bal', 'menorca', 'menorca', 'ciutadella'],
  ['las palmas', 28.1235, -15.4363, 'can', 'gran canaria', 'las palmas de gran canaria', 'gran canaria'],
  ['santa cruz de tenerife', 28.4636, -16.2518, 'can', 'tenerife', 'tenerife', 'la laguna'],
];

export function normalizarCiudad(texto?: string | null): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(provincia|municipio)\b/g, ' ')
    .replace(/[^a-z0-9' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const POR_ALIAS = new Map<string, Ciudad>();
const ALIAS_ORDENADOS: string[] = [];
for (const [nombre, lat, lon, zona, isla, ...alias] of TABLA) {
  const ciudad: Ciudad = { lat, lon, zona, isla };
  for (const n of [nombre, ...alias]) {
    const k = normalizarCiudad(n);
    POR_ALIAS.set(k, ciudad);
    ALIAS_ORDENADOS.push(k);
  }
}
// Los alias largos primero: "santa cruz de tenerife" antes que "tenerife", "san sebastian" antes que "san"
ALIAS_ORDENADOS.sort((a, b) => b.length - a.length);

/** Busca una ciudad conocida en un texto libre ("Sala Apolo, Barcelona", "Madrid centro"). */
export function resolverCiudad(texto?: string | null): { clave: string; ciudad: Ciudad } | null {
  const norm = normalizarCiudad(texto);
  if (!norm) return null;
  const exacta = POR_ALIAS.get(norm);
  if (exacta) return { clave: norm, ciudad: exacta };
  for (const alias of ALIAS_ORDENADOS) {
    if (alias.length < 4) continue;
    if (new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(norm)) {
      return { clave: alias, ciudad: POR_ALIAS.get(alias)! };
    }
  }
  return null;
}

/** Nombre canónico a efectos de comparar "¿es la misma ciudad?" (alias de la misma ciudad coinciden). */
export function mismaCiudad(a?: string | null, b?: string | null): boolean | null {
  const ra = resolverCiudad(a);
  const rb = resolverCiudad(b);
  if (ra && rb) return ra.ciudad === rb.ciudad;
  const na = normalizarCiudad(a);
  const nb = normalizarCiudad(b);
  if (na && nb) return na === nb ? true : null;
  return null;
}

function haversineKm(a: Ciudad, b: Ciudad): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface ViajeEstimado {
  minutos: number;
  km: number;
  medio: 'carretera' | 'vuelo_o_ferry';
}

const FACTOR_CARRETERA = 1.25;
const KMH_MEDIOS = 85;
const MIN_ENTRADA_SALIDA = 10;
const MIN_VUELO_ISLAS_PENINSULA = { bal: 240, can: 300 } as const;
const MIN_VUELO_ENTRE_ISLAS = 180;

/** `null` si alguna de las ciudades no está en la tabla, o si es la misma. */
export function estimarViaje(origen?: string | null, destino?: string | null): ViajeEstimado | null {
  const a = resolverCiudad(origen);
  const b = resolverCiudad(destino);
  if (!a || !b || a.ciudad === b.ciudad) return null;

  const km = haversineKm(a.ciudad, b.ciudad);
  const dist = Math.round(km * FACTOR_CARRETERA);
  const za = a.ciudad.zona;
  const zb = b.ciudad.zona;
  const mismaIsla = za === zb && za !== 'pen' && a.ciudad.isla === b.ciudad.isla;

  if (za === 'pen' && zb === 'pen') {
    return { minutos: Math.round((dist / KMH_MEDIOS) * 60) + MIN_ENTRADA_SALIDA, km: dist, medio: 'carretera' };
  }
  if (mismaIsla) {
    return { minutos: Math.round((dist / KMH_MEDIOS) * 60) + MIN_ENTRADA_SALIDA, km: dist, medio: 'carretera' };
  }
  const insular = za !== 'pen' ? za : zb;
  const minutos = za !== zb ? MIN_VUELO_ISLAS_PENINSULA[insular as 'bal' | 'can'] : MIN_VUELO_ENTRE_ISLAS;
  return { minutos, km: dist, medio: 'vuelo_o_ferry' };
}
