/**
 * Tabla de artículos: unidades que suben a la furgoneta frente a stock final de la noche.
 * Extraído de MerchandisingTab (Strangler Fig) para respetar AGENTS.md §5.6.
 */
import { DoorClosed,Plus,Shirt,Trash2,Truck } from "lucide-react";
import { Button,IconButton,Input } from "../../../ui";
import { ShowIcon } from "../../../ui/ShowIcon";
import { useEventDetail } from "../EventDetailContext";
import { MERCH_CATEGORY_ICONS } from "./merchCategories";
import { useMerchControl } from "./useMerchControl";

/**
 * Tabla de artículos: unidades que suben a la furgoneta frente a stock final de la noche.
 * @returns Sección de interfaz.
 */
export function MerchItemsTable() {
  const { handleDeleteMerchItem, handleUpdateMerchItem, modalRoadbookKey, setShowAddMerchForm, textSub, textTitle } = useEventDetail();
  const { items } = useMerchControl();
  return (
    <>
      {/* Tabla de Artículos: Sube a Furgoneta vs Stock Final Noche */}
      <div
        className={`rounded-[var(--r-m)] overflow-hidden ${'bg-[var(--sunken)]'}`}
      >
        <div className="p-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
            <Shirt className="w-4 h-4" /> Inventario de Merchandising ({items.length} productos)
          </span>
          <span className={`text-xs font-mono ${textSub}`}>
            Ajusta las unidades al subir a la furgoneta y al terminar el bolo
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Shirt className="w-8 h-8 text-[var(--ink-2)] mx-auto" />
            <p className={`text-xs font-mono ${textSub}`}>Sin merchan apuntado para este bolo.</p>
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => setShowAddMerchForm(true)}
              className="items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir primer producto</span>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--hair)]">
            {items.map((item) => {
              const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
              const subtotal = vendidas * (item.precioUnitario || 0);
              const catConfig = MERCH_CATEGORY_ICONS[item.categoria] || MERCH_CATEGORY_ICONS.otro;
              const pctVendido = item.stockInicial > 0 ? Math.round((vendidas / item.stockInicial) * 100) : 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    'hover:bg-[var(--sunken)]'
                  }`}
                >
                  {/* Datos del producto */}
                  <div className="flex items-center gap-2.5 min-w-[220px]">
                    <div className={`p-2 rounded-[var(--r-m)] shrink-0 ${catConfig.color}`}><ShowIcon inline emoji={catConfig.icon} /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-xs font-bold font-sans ${textTitle}`}>{item.nombre}</h4>
                        {item.talla && (
                          <span className="px-1.5 py-0.2 rounded text-micro font-mono font-bold bg-[var(--surface)] text-[var(--ink-2)]">
                            {item.talla}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-micro font-mono text-[var(--ink-2)]">
                        <span>
                          Precio: <strong className="text-[var(--acc)]">{item.precioUnitario}€</strong>
                        </span>
                        <span>•</span>
                        <span>{catConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Controles de Stock Inicial (Sube a Furgoneta) y Stock Final */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center flex-1 max-w-lg">
                    {/* Sube a Furgoneta */}
                    <div
                      className={`p-1.5 rounded-[var(--r-m)] ${'bg-[var(--surface)]'}`}
                    >
                      <span className="block text-micro font-mono text-[var(--ink-2)] mb-1 flex items-center gap-1">
                        <Truck className="w-2.5 h-2.5 text-[var(--acc)]" /> Sube Furgón
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockInicial: Math.max(0, (item.stockInicial || 0) - 1),
                            })
                          }
                          className="w-5 h-5 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                        >
                          -
                        </button>
                        <Input
                          size="sm"
                          type="number"
                          min="0"
                          value={item.stockInicial}
                          onChange={(e) =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockInicial: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-12 text-center"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockInicial: (item.stockInicial || 0) + 1,
                            })
                          }
                          className="w-5 h-5 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Stock Final (Fin de Noche) */}
                    <div
                      className={`p-1.5 rounded-[var(--r-m)] ${'bg-[var(--surface)]'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-micro font-mono text-[var(--ink-2)] flex items-center gap-1">
                          <DoorClosed className="w-2.5 h-2.5 text-[var(--acc)]" /> Stock final
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, { stockFinal: 0 })}
                          className="text-micro font-mono px-1 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 cursor-pointer"
                          title="Marcar como agotado tras el concierto"
                        >
                          Agotado (0)
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockFinal: Math.max(0, (item.stockFinal || 0) - 1),
                            })
                          }
                          className="w-5 h-5 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                        >
                          -
                        </button>
                        <Input
                          size="sm"
                          type="number"
                          min="0"
                          value={item.stockFinal}
                          onChange={(e) =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockFinal: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-12 text-center"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateMerchItem(modalRoadbookKey, item.id, {
                              stockFinal: (item.stockFinal || 0) + 1,
                            })
                          }
                          className="w-5 h-5 rounded bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Resumen Ventas del Artículo */}
                    <div className="col-span-2 sm:col-span-1 flex flex-col items-end justify-center pr-2">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[var(--acc)]">{vendidas} vendidas</span>
                        <span className="block text-xs font-mono font-bold text-[var(--ok)]">{subtotal.toFixed(2)} €</span>
                      </div>
                      <div className="w-20 bg-[var(--surface)] rounded-[var(--r-pill)] h-1 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[var(--acc)] transition-ui duration-300"
                          style={{ width: `${Math.min(100, pctVendido)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end">
                    <IconButton
                      label="Eliminar este artículo del bolo"
                      variant="danger"
                      type="button"
                      onClick={() => handleDeleteMerchItem(modalRoadbookKey, item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
}
