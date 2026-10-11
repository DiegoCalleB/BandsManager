/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Banknote,Shirt,Smartphone } from "lucide-react";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function MerchTab() {
  const { getCurrentRoadbook, selectedDateKey, selectedConcert, getDefaultRoadbook, setModalActiveTab, setShowEventFichaModal } = useCalendar();
  return (
    <>
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-micro">
        {(() => {
          const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
          const merch = currentRb.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
          const items = merch.items || [];
          const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
          const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
          const totalVendidas = Math.max(0, totalInicial - totalFinal);
          const totalTeorico = items.reduce(
            (acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0),
            0
          );
          const totalCobrado = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
          const cuadreDiff = totalCobrado - totalTeorico;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[var(--acc)] text-micro flex items-center gap-1">
                  <Shirt className="w-3 h-3" /> 3. Merch ({totalVendidas}/{totalInicial} uds)
                </span>
                <span className="text-micro font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)]">
                  {totalTeorico.toFixed(0)}€ ventas
                </span>
              </div>

              {/* Arqueo Rápido */}
              <div className="grid grid-cols-2 gap-1.5 text-micro font-mono">
                <div className="p-1.5 rounded bg-[var(--ok)]/10 flex flex-col">
                  <span className="text-[var(--ok)]/80 text-micro flex items-center gap-0.5">
                    <Banknote className="w-2.5 h-2.5" /> Efectivo
                  </span>
                  <span className="font-bold text-[var(--ok)] text-xs">{(merch.ingresosEfectivo || 0).toFixed(0)}€</span>
                </div>
                <div className="p-1.5 rounded bg-[var(--acc)]/10 flex flex-col">
                  <span className="text-[var(--acc)]/80 text-micro flex items-center gap-0.5">
                    <Smartphone className="w-2.5 h-2.5" /> Bizum / TPV
                  </span>
                  <span className="font-bold text-[var(--acc)] text-xs">{(merch.ingresosBizum || 0).toFixed(0)}€</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-micro font-mono px-1 py-0.5 rounded bg-[var(--sunken)]/60 ">
                <span className="text-[var(--ink-2)]">
                  Total cobrado: <strong className="text-[var(--ink)]">{totalCobrado.toFixed(0)}€</strong>
                </span>
                <span
                  className={`font-bold ${cuadreDiff === 0 ? 'text-[var(--ok)]' : cuadreDiff > 0 ? 'text-[var(--acc)]' : 'text-[var(--acc)]'}`}
                >
                  {cuadreDiff === 0
                    ? '✓ Cuadrada'
                    : cuadreDiff > 0
                      ? `+${cuadreDiff.toFixed(0)}€ propina`
                      : `${cuadreDiff.toFixed(0)}€ descuadre`}
                </span>
              </div>

              {/* Stock furgoneta vs fin */}
              <div className="space-y-1">
                {items.slice(0, 4).map((item) => {
                  const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
                  return (
                    <div
                      key={item.id}
                      className={`p-1.5 rounded flex items-center justify-between ${
                        'bg-[var(--surface)] text-[var(--ink)]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium truncate text-micro">
                          {item.nombre} {item.talla ? `(${item.talla})` : ''}
                        </p>
                        <p className="text-micro text-[var(--ink-2)] font-mono">
                          {item.stockInicial} furgón ➔ {item.stockFinal} quedan
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-micro font-mono font-bold text-[var(--acc)]">{vendidas} vend.</span>
                        <p className="text-micro font-mono text-[var(--ink-2)]">{(vendidas * item.precioUnitario).toFixed(0)}€</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {items.length > 4 && (
                <p className="text-micro text-center font-mono text-[var(--ink-2)]">+{items.length - 4} productos más en inventario</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setModalActiveTab('merchan');
                  setShowEventFichaModal(true);
                }}
                className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Shirt className="w-3 h-3" />
                <span>Control merchandising completo</span>
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
