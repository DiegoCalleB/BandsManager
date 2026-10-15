/**
 * Pestaña del checklist de cierre de material (escenario, camerino, furgoneta).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare,ShieldCheck,Trash2 } from "lucide-react";
import { Button,IconButton,Input,Select } from "../../ui";
import type { CierreMaterialItem } from "../../../types";
import { useEventDetail } from "./EventDetailContext";

type CierreCategoria = Exclude<CierreMaterialItem["categoria"], "general">;

/**
 * Pestaña del checklist de cierre de material (escenario, camerino, furgoneta).
 * @returns Sección de interfaz.
 */
export function ClosingChecklistTab() {
  const { modalActiveTab, textTitle, handleToggleAllCierreItems, modalRoadbookKey, modalRoadbook, handleToggleCierreItem, handleDeleteCierreItem, handleAddCierreItem, newCierreItemCat, setNewCierreItemCat, newCierreItemText, setNewCierreItemText } = useEventDetail();
  return (
    <>
{/* TAB 5: CHECKLIST CIERRE DE MATERIAL */}
            {modalActiveTab === 'cierre' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                      Sección 5
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Checklist de cierre de material y carga de furgoneta</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleAllCierreItems(modalRoadbookKey, true)}
                      className="px-2 py-1 rounded text-micro font-mono font-bold bg-[var(--ok)]/20 text-[var(--ink)] hover:bg-[var(--ok)]/30 transition-colors cursor-pointer"
                    >
                      ✓ Marcar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllCierreItems(modalRoadbookKey, false)}
                      className="px-2 py-1 rounded text-micro font-mono font-bold bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    >
                      ↺ Desmarcar
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso y Banner de Estado */}
                {(() => {
                  const items = modalRoadbook.cierreMaterial || [];
                  const checkedCount = items.filter((i) => i.checked).length;
                  const totalCount = items.length;
                  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                  const isCompleted = totalCount > 0 && checkedCount === totalCount;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-[var(--acc)]">
                          {checkedCount} de {totalCount} elementos verificados
                        </span>
                        <span className={isCompleted ? 'text-[var(--ok)]' : 'text-[var(--acc)]'}>{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-hidden">
                        <div
                          className={`h-full transition-ui duration-300 ${
                            isCompleted ? 'bg-[var(--ok)]' : pct > 50 ? 'bg-[var(--acc)]' : 'bg-[var(--acc)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {isCompleted ? (
                        <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)] text-[var(--on-ok)] text-xs font-mono flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-[var(--ok)] shrink-0" />
                          <span>
                            ¡TODO EL MATERIAL VERIFICADO! Escenario y camerinos despejados. Furgoneta cerrada y lista para partir.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/30 text-[var(--ink)] text-xs font-mono flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[var(--acc)] shrink-0" />
                          <span>
                            Verifica uno a uno antes de cerrar la furgoneta para garantizar cero olvidos de cables, instrumentos o ropa.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Listado clasificado por categoría */}
                {['escenario', 'camerino', 'furgoneta'].map((catKey) => {
                  const catLabel =
                    catKey === 'escenario'
                      ? '🎸 Escenario (Backline & Sonido)'
                      : catKey === 'camerino'
                        ? '👕 Camerino (Ropa, Móviles & Merch)'
                        : '🚐 Furgoneta & Vehículo (Estiba & Cierre)';
                  const catItems = (modalRoadbook.cierreMaterial || []).filter((i) => i.categoria === catKey);
                  if (catItems.length === 0) return null;

                  return (
                    <div
                      key={catKey}
                      className={`p-3.5 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--sunken)]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-[var(--acc)]">{catLabel}</h4>
                        <span className="text-micro font-mono text-[var(--ink-2)]">
                          {catItems.filter((i) => i.checked).length}/{catItems.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleCierreItem(item.id, modalRoadbookKey)}
                            className={`p-2.5 rounded-[var(--r-m)] transition-ui flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                              item.checked
                                ? 'bg-[var(--ok)]/30 text-[var(--ink)] line-through'
                                : 'bg-[var(--surface)] text-[var(--ink)] hover:brightness-95'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleToggleCierreItem(item.id, modalRoadbookKey)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded text-[var(--acc)] focus:ring-[var(--acc)] cursor-pointer"
                              />
                              <span className="text-xs font-mono font-medium">{item.item}</span>
                            </div>
                            <IconButton
                              label="Eliminar este ítem"
                              variant="danger"
                              size="icon-xs"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCierreItem(item.id, modalRoadbookKey);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Formulario para añadir ítem al checklist */}
                <form
                  onSubmit={(e) => handleAddCierreItem(modalRoadbookKey, e)}
                  className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 flex-wrap ${
                    'bg-[var(--sunken)]'
                  }`}
                >
                  <Select
                    size="sm"
                    value={newCierreItemCat}
                    onChange={(e) => setNewCierreItemCat(e.target.value as CierreCategoria)}
                  >
                    <option value="escenario">Escenario</option>
                    <option value="camerino">Camerino</option>
                    <option value="furgoneta">Furgoneta</option>
                  </Select>
                  <Input
                    size="sm"
                    type="text"
                    value={newCierreItemText}
                    onChange={(e) => setNewCierreItemText(e.target.value)}
                    placeholder="Añadir ítem a comprobar (ej: soporte de guitarra, cargador portátil)…"
                    className="flex-1 min-w-[200px]"
                  />
                  <Button
                    variant="primary"
                    size="xs"
                    type="submit"
                    disabled={!newCierreItemText.trim()}
                  >
                    + Añadir ítem
                  </Button>
                </form>
              </div>
            )}
    </>
  );
}
