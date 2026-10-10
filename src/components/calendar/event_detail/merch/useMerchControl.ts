/**
 * Control de merchandising del bolo seleccionado y sus totales derivados (stock, venta teórica, cuadre de caja).
 */
import { useEventDetail } from "../EventDetailContext";

/**
 * Totales de merchandising a partir del control del bolo (o el de la hoja de ruta por defecto).
 * @returns Control de merch, artículos y métricas de stock/caja.
 */
export function useMerchControl() {
  const { modalRoadbook, getDefaultRoadbook, selectedConcert } = useEventDetail();
  const merch = modalRoadbook.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
  const items = merch.items || [];
  const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
  const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
  const totalVendidas = Math.max(0, totalInicial - totalFinal);
  const totalVentaTeorica = items.reduce(
    (acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0),
    0
  );
  const totalCobradoReal = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
  const diferenciaCuadre = totalCobradoReal - totalVentaTeorica;
  const porcentajeVendido = totalInicial > 0 ? Math.round((totalVendidas / totalInicial) * 100) : 0;
  return { merch, items, totalInicial, totalFinal, totalVendidas, totalVentaTeorica, totalCobradoReal, diferenciaCuadre, porcentajeVendido };
}
