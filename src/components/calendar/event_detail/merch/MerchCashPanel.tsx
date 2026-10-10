/**
 * Arqueo de caja y cobros (efectivo y Bizum), desglose y observaciones del puesto.
 * Extraído de MerchandisingTab (Strangler Fig) para respetar AGENTS.md §5.6.
 */
import { AlertCircle,Banknote,CheckCircle2,Coins,Smartphone,Sparkles } from "lucide-react";
import { Input,Textarea } from "../../../ui";
import { ShowIcon } from "../../../ui/ShowIcon";
import { useEventDetail } from "../EventDetailContext";
import { useMerchControl } from "./useMerchControl";

/**
 * Arqueo de caja y cobros (efectivo y Bizum), desglose y observaciones del puesto.
 * @returns Sección de interfaz.
 */
export function MerchCashPanel() {
  const { handleUpdateMerchTotals, modalRoadbookKey } = useEventDetail();
  const { merch, totalCobradoReal, diferenciaCuadre } = useMerchControl();
  return (
    <>
      {/* Módulo de Arqueo de Caja y Cobros (Efectivo & Bizum) */}
      <div
        className={`p-4 rounded-[var(--r-m)] space-y-4 ${
          'bg-[var(--sunken)]'
        }`}
      >
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-mono font-bold text-[var(--ok)] flex items-center gap-1.5">
            <Coins className="w-4 h-4" /> Arqueo de caja y métodos de cobro
          </span>
          <span className="text-micro font-mono text-[var(--ink-2)]">
            Introduce los importes reales cobrados durante la noche
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Efectivo Recaudado */}
          <div
            className={`p-3 rounded-[var(--r-m)] ${
              'bg-[var(--surface)]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[var(--ok)] font-mono font-bold text-xs mb-1">
              <Banknote className="w-4 h-4" />
              <span>Efectivo en Caja (€)</span>
            </div>
            <p className="text-micro text-[var(--ink-2)] font-mono mb-2">Billetes y monedas cobrados en el bolo</p>
            <div className="flex items-center gap-1.5">
              <Input
                size="sm"
                type="number"
                step="1"
                min="0"
                value={merch.ingresosEfectivo ?? 0}
                onChange={(e) =>
                  handleUpdateMerchTotals(modalRoadbookKey, {
                    ingresosEfectivo: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full"
              />
              <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
            </div>
          </div>

          {/* Bizum / TPV Recaudado */}
          <div
            className={`p-3 rounded-[var(--r-m)] ${
              'bg-[var(--surface)]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
              <Smartphone className="w-4 h-4" />
              <span>Bizum / TPV (€)</span>
            </div>
            <p className="text-micro text-[var(--ink-2)] font-mono mb-2">Pagos por móvil y datáfono del bolo</p>
            <div className="flex items-center gap-1.5">
              <Input
                size="sm"
                type="number"
                step="1"
                min="0"
                value={merch.ingresosBizum ?? 0}
                onChange={(e) =>
                  handleUpdateMerchTotals(modalRoadbookKey, {
                    ingresosBizum: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full"
              />
              <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
            </div>
          </div>

          {/* Fondo de Caja Inicial */}
          <div
            className={`p-3 rounded-[var(--r-m)] ${
              'bg-[var(--surface)]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
              <Coins className="w-4 h-4" />
              <span>Fondo de Caja (€)</span>
            </div>
            <p className="text-micro text-[var(--ink-2)] font-mono mb-2">Cambio que se llevó al inicio para la mesa</p>
            <div className="flex items-center gap-1.5">
              <Input
                size="sm"
                type="number"
                step="1"
                min="0"
                value={merch.fondoCajaInicial ?? 0}
                onChange={(e) =>
                  handleUpdateMerchTotals(modalRoadbookKey, {
                    fondoCajaInicial: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full"
              />
              <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
            </div>
          </div>
        </div>

        {/* Desglose de Caja Total en Mano */}
        <div
          className={`p-3 rounded-[var(--r-m)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            'bg-[var(--surface)]'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-bold text-[var(--ink-2)]">Resumen del dinero recaudado en el puesto:</span>
            <p className="text-xs font-mono text-[var(--ink-2)]">
              <ShowIcon inline emoji="💵" />{(merch.ingresosEfectivo || 0).toFixed(2)}€ Efectivo + <ShowIcon inline emoji="📱" />{(merch.ingresosBizum || 0).toFixed(2)}€ Bizum ={' '}
              <strong className="text-[var(--ok)]">{totalCobradoReal.toFixed(2)}€ Total Ventas</strong>
            </p>
            {merch.fondoCajaInicial ? (
              <p className="text-micro font-mono text-[var(--ink-2)]">
                (Efectivo físico total a retirar del cajón incluyendo fondo de caja:{' '}
                {((merch.ingresosEfectivo || 0) + (merch.fondoCajaInicial || 0)).toFixed(2)} €)
              </p>
            ) : null}
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-m)] text-xs font-mono font-bold ${
                diferenciaCuadre === 0
                  ? 'bg-[var(--ok)]/20 text-[var(--ink)]'
                  : diferenciaCuadre > 0
                    ? 'bg-[var(--acc)]/20 text-[var(--ink)]'
                    : 'bg-[var(--alert)]/20 text-[var(--ink)]'
              }`}
            >
              {diferenciaCuadre === 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>¡Caja Cuadrada al Céntimo!</span>
                </>
              ) : diferenciaCuadre > 0 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>+{diferenciaCuadre.toFixed(2)} € (Superávit / Donaciones)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
                  <span>{diferenciaCuadre.toFixed(2)} € (Descuadre por revisar)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Observaciones y Notas del Puesto de Merch */}
        <div>
          <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">
            Notas del Puesto de Merchandising / Incidencias
          </label>
          <Textarea
            rows={2}
            placeholder="Ej: Encargado de mesa: Andrea. Las camisetas talla L se agotaron antes del bis. Mucha demanda de púas."
            value={merch.notas || ''}
            onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, { notas: e.target.value })}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
