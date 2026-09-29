/**
 * CONCERT FINANCIAL & BREAK-EVEN P&L SIMULATOR
 *
 * Calcula la rentabilidad financiera por concierto:
 * - Entradas necesarias para cubrir costes (Punto de Equilibrio / Break-Even).
 * - Ingresos brutos por taquilla (anticipada + puerta).
 * - Liquidación de la sala (alquiler fijo o porcentaje sobre taquilla).
 * - Gastos de producción (técnico de sonido, viaje/furgoneta, dietas, alojamiento).
 * - Margen neto total y reparto limpio por músico.
 */

export interface FinancialBreakEvenParams {
  aforo?: number;
  precioAnticipada?: number;
  precioTaquilla?: number;
  alquilerSalaFijo?: number;
  porcentajeSala?: number; // 0 a 100%
  gastosProduccionFijos?: number; // técnico de sonido, furgoneta, etc.
  numMusicos?: number;
  asistenciaEstimada?: number;
}

export interface FinancialBreakEvenResult {
  precio_entrada_anticipada: number;
  precio_entrada_taquilla: number;
  alquiler_sala_fijo: number;
  porcentaje_sala: number;
  gastos_produccion_fijos: number;
  entradas_break_even: number;
  ingresos_totales_estimados: number;
  gastos_totales_estimados: number;
  beneficio_estimado_lleno: number;
  beneficio_por_musico_estimado: number;
  num_musicos: number;
  es_rentable: boolean;
  resumen_financiero: string;
}

export function calculateConcertFinancialBreakEven(
  params: FinancialBreakEvenParams
): FinancialBreakEvenResult {
  const aforo = Math.max(20, params.aforo || 250);
  const pAnticipada = params.precioAnticipada !== undefined ? params.precioAnticipada : 12;
  const pTaquilla = params.precioTaquilla !== undefined ? params.precioTaquilla : 15;
  const alquilerFijo = params.alquilerSalaFijo !== undefined ? params.alquilerSalaFijo : 300;
  const pctSala = params.porcentajeSala !== undefined ? params.porcentajeSala : 15; // ej: 15% o 20%
  const gastosProd = params.gastosProduccionFijos !== undefined ? params.gastosProduccionFijos : 200; // sonido, gasolina
  const numMusicos = Math.max(1, params.numMusicos || 5);

  // Precio medio ponderado estimado (75% anticipada, 25% puerta)
  const precioMedio = (pAnticipada * 0.75) + (pTaquilla * 0.25);
  
  // Margen neto que le queda a la banda por entrada vendida
  const margenBandaPorEntrada = precioMedio * (1 - (pctSala / 100));

  // Costes fijos totales iniciales
  const costesFijosTotales = alquilerFijo + gastosProd;

  // Entradas necesarias para cubrir costes
  const entradasBreakEven = margenBandaPorEntrada > 0 
    ? Math.ceil(costesFijosTotales / margenBandaPorEntrada)
    : aforo;

  // Cálculo a aforo lleno (o asistencia estimada)
  const asistenciaEfectiva = Math.min(aforo, params.asistenciaEstimada || Math.round(aforo * 0.85));
  const ingresosBrutos = (asistenciaEfectiva * 0.75 * pAnticipada) + (asistenciaEfectiva * 0.25 * pTaquilla);
  
  const costeVariableSala = ingresosBrutos * (pctSala / 100);
  const gastosTotales = alquilerFijo + gastosProd + costeVariableSala;
  const beneficioNeto = Math.round(ingresosBrutos - gastosTotales);
  const beneficioPorMusico = Math.round(beneficioNeto / numMusicos);

  return {
    precio_entrada_anticipada: pAnticipada,
    precio_entrada_taquilla: pTaquilla,
    alquiler_sala_fijo: alquilerFijo,
    porcentaje_sala: pctSala,
    gastos_produccion_fijos: gastosProd,
    entradas_break_even: Math.min(aforo, Math.max(1, entradasBreakEven)),
    ingresos_totales_estimados: Math.round(ingresosBrutos),
    gastos_totales_estimados: Math.round(gastosTotales),
    beneficio_estimado_lleno: beneficioNeto,
    beneficio_por_musico_estimado: beneficioPorMusico,
    num_musicos: numMusicos,
    es_rentable: beneficioNeto > 0 && entradasBreakEven <= aforo,
    resumen_financiero: beneficioNeto > 0
      ? `Rentable a partir de ${entradasBreakEven} entradas (${Math.round((entradasBreakEven / aforo) * 100)}% de aforo). Beneficio neto estimado: ${beneficioNeto} € (${beneficioPorMusico} €/músico).`
      : `Atención: Con la estructura actual necesitas más del 100% de aforo para no perder dinero. Considera subir la entrada a ${pAnticipada + 2} € o negociar el alquiler fijo.`
  };
}
