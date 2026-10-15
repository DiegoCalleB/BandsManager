/**
 * Maqueta del CRM de booking: cabecera, filtros, listado, modal de sala, plantillas y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ActiveFiltersBar } from "./ActiveFiltersBar";
import { BookingHeaderSection } from "./BookingHeaderSection";
import { BulkActionsSection } from "./BulkActionsSection";
import { CrmModalsHost } from "./CrmModalsHost";
import { EnrichBanner } from "./EnrichBanner";
import { FiltersPanelSection } from "./FiltersPanelSection";
import { ListOrMapArea } from "./ListOrMapArea";
import { MobileCreateFab } from "./MobileCreateFab";
import { MorningBriefingSection } from "./MorningBriefingSection";
import { RouteAnchorBanner } from "./RouteAnchorBanner";
import { StatusTabsBar } from "./StatusTabsBar";
import { TemplatesConfigCard } from "./TemplatesConfigCard";
import { VenueWorkspaceHost } from "./VenueWorkspaceHost";

/**
 * Maqueta del CRM de booking: cabecera, filtros, listado, modal de sala, plantillas y modales.
 * @returns Sección de interfaz.
 */
export function BookingCrmLayout() {
  return (
    <>
      <div
      data-modulo="booking"
      className="space-y-4 text-[var(--ink)] bg-[var(--bg)] w-full font-sans"
    >
      {/* 2. LEADS CRM WORKSPACE */}
      <div className="w-full items-start transition-ui duration-300">
      {/* LEADS LIST AREA (Always 100% full width — detail opens in workspace modal) */}
      <div className="w-full space-y-4 transition-ui duration-300">
      <div className="space-y-3 sm:space-y-4">
        <BookingHeaderSection />

        <EnrichBanner />

        <FiltersPanelSection />

        <ActiveFiltersBar />

        <MorningBriefingSection />

        <StatusTabsBar />

        <RouteAnchorBanner />

        <BulkActionsSection />

        <ListOrMapArea />
      </div>
      </div>

      <VenueWorkspaceHost />
      </div>

      <TemplatesConfigCard />

      <CrmModalsHost />

      <MobileCreateFab />
    </div>
    </>
  );
}
