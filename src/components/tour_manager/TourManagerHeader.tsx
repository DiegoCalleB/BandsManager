/**
 * Cabecera del gestor de giras.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Plus,Truck } from "lucide-react";
import { Button } from "../ui";
import { useTourManager } from "./TourManagerContext";

/**
 * Cabecera del gestor de giras.
 * @returns Sección de interfaz.
 */
export function TourManagerHeader() {
  const { colors, currentBandName, handleOpenCreateModal } = useTourManager();
  return (
    <>
<div className={`p-5 sm:p-6 rounded-[var(--r-l)] ${colors.card}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="page-title flex items-center gap-2">
              <Truck className="w-6 h-6 text-[var(--ink-2)]" />
              Giras
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-1 max-w-xl`}>
              Ruta, furgo, dietas y reparto de gastos de {currentBandName}. Lo que apuntes aquí se
              refleja solo en Calendario y Finanzas.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="items-center gap-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nueva gira</span>
          </Button>
        </div>
      </div>
    </>
  );
}
