import { Concert, ConcertExpenseBreakdown } from '../types';

export interface TravelConfigOptions {
  vehiculoTipo?: 'furgoneta' | 'coche_1' | 'coches_2' | 'tren_bus';
  numPersonas?: number;
  incluirHotel?: boolean;
  precioGasolinaPorLitro?: number;
}

export interface BreakEvenAnalysis {
  costesTransporteEstimados: number;
  costesAlojamientoEstimados: number;
  costesDietasEstimados: number;
  gastosTotalesEstimados: number;
  cacheFijoGarantizado: number;
  precioEntradaSugerido: number;
  entradasParaBreakEven: number;
  aforoPercentBreakEven: number;
  entradasVendidasActuales: number;
  ingresoBrutoTaquillaEstimado: number;
  beneficioNetoEstimado: number;
  estadoRentabilidad: 'beneficio' | 'cubierto' | 'perdida_moderada' | 'riesgo';
  mensajeStatus: string;
  distanciaKmEstimada: number;
  autoGastosDetalle: ConcertExpenseBreakdown;
  esMismaCiudad: boolean;
}

// Distancias aproximadas entre ciudades españolas comunes (en km ida y vuelta)
const DISTANCIAS_ESTIMADAS_KM: Record<string, number> = {
  'madrid-barcelona': 1240,
  'madrid-valencia': 700,
  'madrid-sevilla': 1080,
  'madrid-bilbao': 800,
  'madrid-zaragoza': 640,
  'madrid-malaga': 1060,
  'madrid-granada': 840,
  'madrid-alicante': 840,
  'madrid-valladolid': 420,
  'madrid-vigo': 1180,
  'madrid-coruña': 1190,
  'madrid-san sebastian': 900,
  'barcelona-valencia': 700,
  'barcelona-zaragoza': 620,
  'barcelona-bilbao': 1220,
  'barcelona-sevilla': 2000,
  'valencia-sevilla': 1300,
  'valencia-alicante': 340,
  'bilbao-san sebastian': 200,
  'zaragoza-bilbao': 600,
};

export function autoCalcularGastosViajeConcierto(
  concert: Concert,
  ciudadBaseBanda: string = 'Madrid',
  numComponentesDefault: number = 4,
  customOptions?: TravelConfigOptions
): {
  distanciaKm: number;
  esMismaCiudad: boolean;
  gastos: ConcertExpenseBreakdown;
} {
  const ciudadOrigen = (ciudadBaseBanda || 'Madrid').trim().toLowerCase();
  const ciudadDestino = (concert.ciudad || 'Madrid').trim().toLowerCase();
  const esMismaCiudad = ciudadOrigen === ciudadDestino;

  let distanciaKm = 300;
  if (esMismaCiudad) {
    distanciaKm = 40; // Bolo local
  } else {
    const key = `${ciudadOrigen}-${ciudadDestino}`;
    const keyReverse = `${ciudadDestino}-${ciudadOrigen}`;
    distanciaKm = DISTANCIAS_ESTIMADAS_KM[key] || DISTANCIAS_ESTIMADAS_KM[keyReverse] || 650;
  }

  const numPersonas = customOptions?.numPersonas ?? numComponentesDefault ?? 4;
  const precioGasolina = customOptions?.precioGasolinaPorLitro ?? 1.65;
  const vehiculoTipo = customOptions?.vehiculoTipo ?? 'furgoneta';

  // Consumos según tipo de vehículo (Litros por 100km)
  let consumoL100km = 9.0;
  if (vehiculoTipo === 'coche_1') consumoL100km = 6.5;
  if (vehiculoTipo === 'coches_2') consumoL100km = 13.0;
  if (vehiculoTipo === 'tren_bus') consumoL100km = 0;

  let costeGasolina = 0;
  if (vehiculoTipo === 'tren_bus') {
    costeGasolina = Math.round(numPersonas * 45);
  } else {
    costeGasolina = Math.round((distanciaKm / 100) * consumoL100km * precioGasolina);
  }

  // Dietas según distancia
  let costeDietas = 0;
  if (esMismaCiudad) {
    costeDietas = numPersonas * 12;
  } else if (distanciaKm <= 200) {
    costeDietas = numPersonas * 18;
  } else {
    costeDietas = numPersonas * 25;
  }

  // Alojamiento
  const incluirHotel = customOptions?.incluirHotel ?? (!esMismaCiudad && distanciaKm > 200);
  const costeAlojamiento = incluirHotel ? numPersonas * 38 : 0;

  const gastos: ConcertExpenseBreakdown = {
    gasolina: costeGasolina,
    dietas: costeDietas,
    alojamiento: costeAlojamiento,
    alquilerVehiculo: 0,
    otros: esMismaCiudad ? 0 : 15,
    notasGastos: `Autocalculado: ${distanciaKm}km (${ciudadOrigen} ↔ ${ciudadDestino}), ${numPersonas} pers., ${vehiculoTipo}`,
  };

  return { distanciaKm, esMismaCiudad, gastos };
}

export function calcularBreakEvenConcierto(
  concert: Concert,
  ciudadBaseBanda: string = 'Madrid',
  numComponentes: number = 4,
  customTravelOptions?: TravelConfigOptions
): BreakEvenAnalysis {
  const {
    distanciaKm,
    esMismaCiudad,
    gastos: autoGastos,
  } = autoCalcularGastosViajeConcierto(concert, ciudadBaseBanda, numComponentes, customTravelOptions);

  const gDetalle = concert.gastosDetalle && Object.keys(concert.gastosDetalle).length > 0 ? concert.gastosDetalle : autoGastos;

  const costeGasolina = gDetalle.gasolina ?? autoGastos.gasolina;
  const costeAlojamiento = gDetalle.alojamiento ?? autoGastos.alojamiento;
  const costeDietas = gDetalle.dietas ?? autoGastos.dietas;
  const otrosGastos = (gDetalle.alquilerVehiculo || 0) + (gDetalle.otros || 0);

  const gastosTotalesEstimados = costeGasolina + costeAlojamiento + costeDietas + otrosGastos;

  const cacheFijoGarantizado = Number(concert.cache) || 0;
  const precioEntradaSugerido = Number(concert.precioEntradaEstimado) || 10;
  const entradasVendidasActuales = Number(concert.aforo_vendido) || 0;
  const aforoTotal = Number(concert.aforo_total) || 150;

  const costePendienteDeTaquilla = Math.max(0, gastosTotalesEstimados - cacheFijoGarantizado);

  const entradasParaBreakEven = precioEntradaSugerido > 0 ? Math.ceil(costePendienteDeTaquilla / precioEntradaSugerido) : 0;

  const aforoPercentBreakEven = aforoTotal > 0 ? Math.min(100, Math.round((entradasParaBreakEven / aforoTotal) * 100)) : 0;

  const ingresoBrutoTaquillaEstimado = entradasVendidasActuales * precioEntradaSugerido;
  const beneficioNetoEstimado = cacheFijoGarantizado + ingresoBrutoTaquillaEstimado - gastosTotalesEstimados;

  let estadoRentabilidad: BreakEvenAnalysis['estadoRentabilidad'] = 'cubierto';
  let mensajeStatus = '';

  if (beneficioNetoEstimado >= 100) {
    estadoRentabilidad = 'beneficio';
    mensajeStatus = `🟢 Bolo rentable (+${beneficioNetoEstimado}€ previstos). Costes cubiertos.`;
  } else if (beneficioNetoEstimado >= 0) {
    estadoRentabilidad = 'cubierto';
    mensajeStatus = `🟡 Cubres gastos (Punto de equilibrio sin pérdidas).`;
  } else if (Math.abs(beneficioNetoEstimado) <= 150) {
    estadoRentabilidad = 'perdida_moderada';
    mensajeStatus = `🟧 Faltan ~${entradasParaBreakEven - entradasVendidasActuales} entradas para cubrir gastos.`;
  } else {
    estadoRentabilidad = 'riesgo';
    mensajeStatus = `🔴 Riesgo de pérdida (-${Math.abs(beneficioNetoEstimado)}€). Necesitas vender ${entradasParaBreakEven} entradas.`;
  }

  return {
    costesTransporteEstimados: costeGasolina,
    costesAlojamientoEstimados: costeAlojamiento,
    costesDietasEstimados: costeDietas,
    gastosTotalesEstimados,
    cacheFijoGarantizado,
    precioEntradaSugerido,
    entradasParaBreakEven,
    aforoPercentBreakEven,
    entradasVendidasActuales,
    ingresoBrutoTaquillaEstimado,
    beneficioNetoEstimado,
    estadoRentabilidad,
    mensajeStatus,
    distanciaKmEstimada: distanciaKm,
    autoGastosDetalle: autoGastos,
    esMismaCiudad,
  };
}
