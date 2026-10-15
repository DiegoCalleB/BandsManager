/**
 * Pestañas de estado de los leads con contadores.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { isLeadNeedsFollowup } from "../../../utils/bookingFollowup";
import { normalizeStatus } from "../../../utils/bookingUtils";
import { Button } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Pestañas de estado de los leads con contadores.
 * @returns Sección de interfaz.
 */
export function StatusTabsBar() {
  const { sectionLeads, statusFilter, setStatusFilter } = useBookingCrm();
  return (
    <>
      {/* Main Status Tabs Bar (Clean, no-scrollbar, single row) */}
      <div className="pin-top flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar">
      {(
        [
          { key: 'todos', label: 'Todos' },
          { key: 'nuevo', label: 'Por contactar' },
          { key: 'esperando_respuesta', label: 'Contactados' },
          { key: 'seguimientos', label: 'Seguimientos' },
          { key: 'respondido', label: 'En conversación' },
          { key: 'negociando', label: 'Negociando' },
          { key: 'confirmado', label: 'Confirmados' },
          { key: 'aplazado', label: 'Aplazados' },
          { key: 'no_interesado', label: 'Descartados' },
        ] as const
      ).map((tab) => {
        const count =
          tab.key === 'todos'
            ? sectionLeads.length
            : tab.key === 'seguimientos'
              ? sectionLeads.filter((l) => isLeadNeedsFollowup(l)).length
              : sectionLeads.filter((l) => {
                  const norm = normalizeStatus(l.estado);
                  if (tab.key === 'esperando_respuesta') return norm === 'esperando_respuesta' || norm === 'enviado';
                  return norm === tab.key;
                }).length;
        const isSelected = statusFilter === tab.key;

        return (
          <Button
            variant={isSelected ? "inverse" : "neutral"}
            size="xs"
            id={`crm-filter-${tab.key}`}
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 items-center gap-1.5 ${count === 0 && !isSelected && tab.key !== 'todos' ? 'max-sm:hidden' : ''}`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-micro px-1.5 py-0.2 rounded-[var(--r-pill)] tabular-nums ${
                isSelected ? 'bg-[var(--bg)] text-[var(--ink)]' : 'bg-[var(--surface)] text-[var(--ink-2)]'
              }`}
            >
              {count}
            </span>
          </Button>
        );
      })}
      </div>
    </>
  );
}
