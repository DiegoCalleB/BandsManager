/**
 * Formulario de alta de un artículo de merchandising.
 * Extraído de MerchandisingTab (Strangler Fig) para respetar AGENTS.md §5.6.
 */
import { AnimatePresence,motion } from "framer-motion";
import { Check,Plus } from "lucide-react";
import { Button,Input,Select } from "../../../ui";
import { useEventDetail } from "../EventDetailContext";
import type { MerchCategoria } from "./merchCategories";

/**
 * Formulario de alta de un artículo de merchandising.
 * @returns Sección de interfaz.
 */
export function MerchAddForm() {
  const { handleAddMerchItem, modalRoadbookKey, newMerchCategoria, newMerchNombre, newMerchPrecio, newMerchStockInicial, newMerchTalla, setNewMerchCategoria, setNewMerchNombre, setNewMerchPrecio, setNewMerchStockInicial, setNewMerchTalla, setShowAddMerchForm, showAddMerchForm, textSub } = useEventDetail();
  return (
    <>
      {/* Formulario Añadir Producto */}
      <AnimatePresence>
        {showAddMerchForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => handleAddMerchItem(modalRoadbookKey, e)}
            className={`p-3.5 rounded-[var(--r-m)] space-y-3 ${
              'bg-[var(--acc-soft)]/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuevo artículo de merchandising para este concierto
              </span>
              <button
                type="button"
                onClick={() => setShowAddMerchForm(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink-2)] text-xs font-mono cursor-pointer"
              >
                ✕ Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
              <div className="md:col-span-2">
                <label className={`block text-micro mb-1 ${textSub}`}>Nombre del Producto *</label>
                <Input
                  size="sm"
                  type="text"
                  required
                  placeholder="Ej: Camiseta Gira Oficial, Vinilo LP…"
                  value={newMerchNombre}
                  onChange={(e) => setNewMerchNombre(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-micro mb-1 ${textSub}`}>Categoría</label>
                <Select size="sm" aria-label="Categoría"
                  value={newMerchCategoria}
                  onChange={(e) => setNewMerchCategoria(e.target.value as MerchCategoria)}
                  wrapperClassName="w-full"
                >
                  <option value="camisetas">Camisetas</option>
                  <option value="vinilos">Vinilos</option>
                  <option value="musica">Música (CD/Tape)</option>
                  <option value="accesorios">Púas / Accesorios</option>
                  <option value="otro">Otro</option>
                </Select>
              </div>

              <div>
                <label className={`block text-micro mb-1 ${textSub}`}>Talla / versión</label>
                <Input
                  size="sm"
                  type="text"
                  placeholder="Ej: M, L, XL, 12'', Pack…"
                  value={newMerchTalla}
                  onChange={(e) => setNewMerchTalla(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className={`block text-micro mb-1 ${textSub}`}>Precio (€)</label>
                  <Input size="sm" aria-label="Precio (€)"
                    type="number"
                    step="0.5"
                    min="0"
                    value={newMerchPrecio}
                    onChange={(e) => setNewMerchPrecio(Number(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className={`block text-micro mb-1 ${textSub}`}>Furgón (uds)</label>
                  <Input size="sm" aria-label="Furgón (uds)"
                    type="number"
                    min="0"
                    value={newMerchStockInicial}
                    onChange={(e) => setNewMerchStockInicial(Number(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                size="xs"
                type="submit"
                className="items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar producto en el bolo</span>
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

    </>
  );
}
