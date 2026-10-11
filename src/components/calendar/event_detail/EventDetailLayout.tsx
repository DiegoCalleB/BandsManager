/**
 * Maqueta de la ficha de evento: portal, barra superior, cabecera, avisos, pestañas y su contenido.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ModalPortal } from "../../common/ModalPortal";
import { ClosingChecklistTab } from "./ClosingChecklistTab";
import { DeleteConfirmPanel } from "./DeleteConfirmPanel";
import { useEventDetail } from "./EventDetailContext";
import { EventHeaderSection } from "./EventHeaderSection";
import { EventTabsNav } from "./EventTabsNav";
import { EventTopBar } from "./EventTopBar";
import { EventWeatherSection } from "./EventWeatherSection";
import { HolidayWarningSection } from "./HolidayWarningSection";
import { KeyContactsTab } from "./KeyContactsTab";
import { MerchandisingTab } from "./MerchandisingTab";
import { OverviewTab } from "./OverviewTab";
import { PostShowTab } from "./PostShowTab";
import { TechnicalLogisticsTab } from "./TechnicalLogisticsTab";

/**
 * Maqueta de la ficha de evento: portal, barra superior, cabecera, avisos, pestañas y su contenido.
 * @returns Sección de interfaz.
 */
export function EventDetailLayout() {
  const { showEventFichaModal, setShowEventFichaModal, handleModalTouchStart, handleModalTouchMove, handleModalTouchEnd } = useEventDetail();
  return (
    <>
<ModalPortal isOpen={showEventFichaModal} onClose={() => setShowEventFichaModal(false)}>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 sm:pt-16 bg-[var(--scrim)]/70 animate-in fade-in duration-200">
        <div
          onTouchStart={handleModalTouchStart}
          onTouchMove={handleModalTouchMove}
          onTouchEnd={handleModalTouchEnd}
          className={`relative w-full max-w-3xl rounded-[var(--r-l)] max-h-[85vh] sm:max-h-[88vh] overflow-y-auto ${
            'bg-[var(--surface)] text-[var(--ink)]'
          }`}
        >
          <EventTopBar />

          <div className="p-5 sm:p-7 space-y-4">
            <EventHeaderSection />

            <DeleteConfirmPanel />

            <HolidayWarningSection />

            <EventWeatherSection />

            <EventTabsNav />

            <OverviewTab />

            <TechnicalLogisticsTab />

            <KeyContactsTab />

            <MerchandisingTab />

            <PostShowTab />

            <ClosingChecklistTab />
          </div>
        </div>
      </div>
    </ModalPortal>
    </>
  );
}
