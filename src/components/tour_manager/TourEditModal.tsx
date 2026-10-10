/**
 * Modal de creación y edición de una gira.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity,Truck } from "lucide-react";
import type { Tour } from "../../types";
import { ModalPortal } from "../common/ModalPortal";
import { Button,Input,Select } from "../ui";
import { TourConvocatoriaSection } from "./TourConvocatoriaSection";
import { TourFleetSection } from "./TourFleetSection";
import { useTourManager } from "./TourManagerContext";
import { TourStatsSummary } from "./TourStatsSummary";
import { TourStopsSection } from "./TourStopsSection";
import { TourSyncOptions } from "./TourSyncOptions";

/**
 * Modal de creación y edición de una gira.
 * @returns Sección de interfaz.
 */
export function TourEditModal() {
  const { isModalOpen, setIsModalOpen, colors, editingTour, handleSave, formNombre, setFormNombre, formEstado, setFormEstado,} = useTourManager();
  return (
    <>
{isModalOpen && (
        <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div data-modulo="sala" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
            <div
              className={`w-full max-w-4xl rounded-[var(--r-l)] ${colors.bg} flex flex-col my-auto max-h-[90vh]`}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 flex justify-between items-center bg-[var(--sunken)] shrink-0">
                <div>
                  <h3 className="text-lg font-bold font-display flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[var(--ink-2)]" />
                    {editingTour ? "Editar Gira" : "Nueva Gira"}
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5">
                    Configura la ruta, flota de vehículos, selección de miembros
                    y sincronización automática.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  &times;
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form
                  id="tour-form"
                  onSubmit={handleSave}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        className={`text-micro font-sans ${colors.textMuted}`}
                      >
                        Nombre de la Gira *
                      </label>
                      <Input
                        required
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="Ej. Tour Peninsular Primavera 2026"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        className={`text-micro font-sans ${colors.textMuted}`}
                      >
                        Estado de la Gira
                      </label>
                      <Select aria-label="Estado de la Gira"
                        value={formEstado}
                        onChange={(e) => setFormEstado(e.target.value as Tour["estado"])}
                        wrapperClassName="w-full"
                      >
                        <option value="planificacion">En Planificación</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </Select>
                    </div>

                    {/* SELECCIÓN DE MIEMBROS DE LA BANDA (FORMACIÓN COMPLETA VS PARCIAL) */}
                    <TourConvocatoriaSection />

                    {/* Multi-Vehicle & Fuel Calculation Settings */}
                    <TourFleetSection />
                  </div>

                  {/* Stops / Ruta */}
                  <TourStopsSection />

                  {/* Sincronización Automática Checkboxes */}
                  <TourSyncOptions />

                  {/* Balance General de Gira */}
                  <TourStatsSummary />
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 flex justify-end gap-3 bg-[var(--sunken)] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[var(--r-pill)] text-sm font-medium hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <Button
                  variant="primary"
                  type="submit"
                  form="tour-form"
                  className="items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  {editingTour ? "Guardar Cambios" : "Crear Gira"}
                </Button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
