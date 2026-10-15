import {
CalendarCheck,
CheckSquare,
Loader2,
MinusSquare,
Sparkles,
Square
} from "lucide-react";
import { Button } from '../../ui';
import { ChangeLeadImageModal } from "../ChangeLeadImageModal";
import { LeadGridCard } from "./LeadGridCard";
import { LeadTableRow } from "./LeadTableRow";

import type { LeadsTableProps } from "../LeadsTable";
import { useLeadsTable } from "./LeadsTableContext";

/**
 * Vista de leads: filtros superiores, rejilla o tabla, y modal de cambio de imagen.
 * @returns La lista de leads según el modo de vista, o el aviso de lista vacía.
 */
type MediaTypeFilter = NonNullable<LeadsTableProps["mediaTypeFilter"]>;

export function LeadsTableView() {
  const { headerCheckboxRef, filteredLeads, leadForImageChange, setLeadForImageChange, handleBatchScanDates, isScanningBatchDates, batchScanResult, setBatchScanResult, selectedLead, onUpdateLead, onLeadLogoUpload, viewMode, sectionTab, mediaTypeFilter, setMediaTypeFilter, selectedLeadIds, onToggleSelectLead, onSelectAllFiltered, onDeselectAll, isAllSelected, isSomeSelected,} = useLeadsTable();





  if (filteredLeads.length === 0) {
    return (
      <div className="p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)] my-4">
  <Sparkles className="w-8 h-8 text-[var(--acc-ink)] mx-auto mb-2 opacity-60" />
  <p className="text-[var(--ink-2)] font-bold text-sm">
    Con esos filtros no sale ninguna sala
  </p>
  <p className="text-[var(--ink-2)] text-xs mt-1">
    Prueba a cambiar los filtros o los términos de búsqueda.
  </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Filter Tabs & Selection Bar if applicable */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
  {sectionTab === "medios" && setMediaTypeFilter && (
    <div className="flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar py-0.5">
      {["todos", "televisión", "radio", "redes", "managements"].map(
  (type) => (
    <Button
      variant={mediaTypeFilter === type ? "inverse" : "neutral"}
      size="xs"
      key={type}
      onClick={() => setMediaTypeFilter(type as MediaTypeFilter)}
    >
      {type}
    </Button>
  ),
      )}
    </div>
  )}

  {/* Quick select buttons in Grid view */}
  {viewMode === "grid" && onToggleSelectLead && (
    <div className="flex items-center gap-2 text-xs font-sans ml-auto">
      <button
  type="button"
  onClick={isAllSelected ? onDeselectAll : onSelectAllFiltered}
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--bg)]/90 hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer"
      >
  {isAllSelected ? (
    <>
      <CheckSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
      <span>Deseleccionar todos ({filteredLeads.length})</span>
    </>
  ) : isSomeSelected ? (
    <>
      <MinusSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
      <span>Seleccionar todos ({filteredLeads.length})</span>
    </>
  ) : (
    <>
      <Square className="w-3.5 h-3.5 text-[var(--ink-2)]" />
      <span>Seleccionar todos ({filteredLeads.length})</span>
    </>
  )}
      </button>
      {selectedLeadIds.length > 0 && (
  <span className="text-[var(--ink)] font-bold bg-[var(--acc)]/15 px-2 py-0.5 rounded-[var(--r-s)] text-xs">
    {selectedLeadIds.length} selecc.
  </span>
      )}

      <Button
  variant="primary"
  size="xs"
  type="button"
  onClick={handleBatchScanDates}
  disabled={isScanningBatchDates}
  className="items-center gap-1.5"
  title="Escanea las carteleras de los recintos de la campaña para detectar sus fines de semana libres"
      >
  {isScanningBatchDates ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
  ) : (
    <CalendarCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
  )}
  <span>
    {isScanningBatchDates
      ? "Escaneando carteleras..."
      : `📡 Radar Fechas Libres (${selectedLeadIds.length > 0 ? selectedLeadIds.length : "Campaña"})`}
  </span>
      </Button>
    </div>
  )}
      </div>

      {batchScanResult && (
  <div className="mb-3 p-2.5 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-sans flex items-center justify-between gap-2 animate-fadeIn">
    <span>{batchScanResult}</span>
    <button
      type="button"
      onClick={() => setBatchScanResult(null)}
      className="text-[var(--acc)] hover:text-[var(--ink)] text-xs font-bold px-1.5 cursor-pointer"
    >
      ✕
    </button>
  </div>
      )}

      {viewMode === "grid" ? (
  <div
    className={`grid gap-4 pb-10 transition-ui duration-300 ${
      selectedLead
  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    }`}
  >
    {filteredLeads.map((lead, idx) => (
      <LeadGridCard key={lead.id || `lead-${idx}`} lead={lead} idx={idx} />
    ))}
  </div>
      ) : (
  /* TABLE VIEW */
  <div className="overflow-x-auto shrink-0 rounded-[var(--r-l)] bg-[var(--surface)] pb-10">
    <table className="w-full text-left min-w-[980px]">
      <thead>
  <tr className="text-micro font-semibold text-[var(--ink-2)] bg-[var(--sunken)]">
    {/* Select All Checkbox Header */}
    {onToggleSelectLead && (
      <th className="py-2.5 px-2.5 w-10 text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            ref={headerCheckboxRef}
            checked={isAllSelected}
            onChange={
              isAllSelected ? onDeselectAll : onSelectAllFiltered
            }
            className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
            title={
              isAllSelected
                ? "Deseleccionar todos"
                : "Seleccionar todos los resultados"
            }
          />
        </div>
      </th>
    )}

    <th className="py-2 px-2 w-8 text-center whitespace-nowrap">
      Fav
    </th>
    <th className="py-2 px-2.5 min-w-[155px] whitespace-nowrap">
      {sectionTab === "medios"
        ? "Medio / Contacto"
        : sectionTab === "grupos"
          ? "Banda / Management"
          : "Espacio / Nombre"}
    </th>
    <th className="py-2 px-2 min-w-[70px] whitespace-nowrap">
      Tipo
    </th>
    <th className="py-2 px-2 min-w-[80px] whitespace-nowrap">
      Fiabilidad
    </th>
    <th className="py-2 px-2 min-w-[95px] whitespace-nowrap">
      Salud / Temp
    </th>
    <th className="py-2 px-2 min-w-[90px] whitespace-nowrap">
      Ciudad
    </th>
    <th className="py-2 px-2 min-w-[65px] whitespace-nowrap">
      {sectionTab === "grupos" ? "Róster / Aforo" : "Aforo"}
    </th>
    <th className="py-2 px-2 min-w-[95px] whitespace-nowrap">
      Estado
    </th>
    <th className="py-2 px-2 min-w-[130px] whitespace-nowrap">
      Contacto / directo
    </th>
    <th className="py-2 px-2 min-w-[105px] text-right whitespace-nowrap">
      Acciones rápidas
    </th>
  </tr>
      </thead>
      <tbody className="divide-y divide-[var(--hair)] text-xs align-middle">
  {filteredLeads.map((lead, idx) => (
    <LeadTableRow key={lead.id || `lead-${idx}`} lead={lead} idx={idx} />
  ))}
      </tbody>
    </table>
  </div>
      )}

      {/* Change Image Modal */}
      {leadForImageChange && (
  <ChangeLeadImageModal
    lead={leadForImageChange}
    isOpen={Boolean(leadForImageChange)}
    onClose={() => setLeadForImageChange(null)}
    onUpdateLead={(id, updates) => {
      onUpdateLead(id, updates);
      setLeadForImageChange(null);
    }}
    onLeadLogoUpload={onLeadLogoUpload}
  />
      )}
    </div>
  );
};
