/**
 * Cuadrícula de KPIs de merchandising: stock, unidades vendidas, venta teórica, cobrado y cuadre.
 * Extraído de MerchandisingTab (Strangler Fig) para respetar AGENTS.md §5.6.
 */
import { Calculator,Coins,ShieldCheck,ShoppingBag,Truck,Zap } from "lucide-react";
import { useEventDetail } from "../EventDetailContext";
import { useMerchControl } from "./useMerchControl";

/**
 * Cuadrícula de KPIs de merchandising: stock, unidades vendidas, venta teórica, cobrado y cuadre.
 * @returns Sección de interfaz.
 */
export function MerchKpiGrid() {
  const { textTitle } = useEventDetail();
  const { totalInicial, totalFinal, totalVendidas, totalVentaTeorica, totalCobradoReal, diferenciaCuadre, porcentajeVendido } = useMerchControl();
  return (
    <>
      {/* KPI Grid: Cuadre y Métricas Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div
          className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <Truck className="w-3 h-3 text-[var(--acc)]" /> Sube a Furgón
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalInicial}</span>
            <span className="text-micro text-[var(--ink-2)] font-mono">uds</span>
          </div>
          <p className="text-micro text-[var(--ink-2)] font-mono">Inventario de salida</p>
        </div>

        <div
          className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-[var(--acc)]" /> Stock final
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalFinal}</span>
            <span className="text-micro text-[var(--ink-2)] font-mono">uds</span>
          </div>
          <p className="text-micro text-[var(--ink-2)] font-mono">Quedan en furgoneta</p>
        </div>

        <div
          className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[var(--ok)]" /> Vendidas
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[var(--ok)]">{totalVendidas}</span>
            <span className="text-micro text-[var(--ok)]/70 font-mono font-bold">({porcentajeVendido}%)</span>
          </div>
          <p className="text-micro text-[var(--ink-2)] font-mono">Salidas del bolo</p>
        </div>

        <div
          className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <Calculator className="w-3 h-3 text-[var(--acc)]" /> Venta Teórica
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[var(--acc)]">{totalVentaTeorica.toFixed(2)}</span>
            <span className="text-micro text-[var(--ink-2)] font-mono">€</span>
          </div>
          <p className="text-micro text-[var(--ink-2)] font-mono">Según inventario</p>
        </div>

        <div
          className={`p-2.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <Coins className="w-3 h-3 text-[var(--ok)]" /> Cobrado real
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[var(--ok)]">{totalCobradoReal.toFixed(2)}</span>
            <span className="text-micro text-[var(--ink-2)] font-mono">€</span>
          </div>
          <p className="text-micro text-[var(--ink-2)] font-mono">Efectivo + Bizum</p>
        </div>

        <div
          className={`p-2.5 rounded-[var(--r-m)] ${
            diferenciaCuadre === 0
              ? 'bg-[var(--ok-soft)]'
              : diferenciaCuadre > 0
                ? 'bg-[var(--acc-soft)]'
                : 'bg-[var(--alert)]'
          }`}
        >
          <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Cuadre Caja
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-base font-bold font-mono ${
                diferenciaCuadre === 0 ? 'text-[var(--ok)]' : diferenciaCuadre > 0 ? 'text-[var(--acc)]' : 'text-[var(--alert)]'
              }`}
            >
              {diferenciaCuadre === 0
                ? '0.00'
                : diferenciaCuadre > 0
                  ? `+${diferenciaCuadre.toFixed(2)}`
                  : diferenciaCuadre.toFixed(2)}
            </span>
            <span className="text-micro font-mono text-[var(--ink-2)]">€</span>
          </div>
          <p
            className={`text-micro font-mono font-bold ${
              diferenciaCuadre === 0 ? 'text-[var(--ok)]' : diferenciaCuadre > 0 ? 'text-[var(--acc)]' : 'text-[var(--alert)]'
            }`}
          >
            {diferenciaCuadre === 0 ? '✓ Caja exacta' : diferenciaCuadre > 0 ? 'Superávit / Propinas' : 'Descuadre faltante'}
          </p>
        </div>
      </div>

    </>
  );
}
