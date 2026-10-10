/**
 * Maqueta del modal: portal, cabecera, pestañas, cuerpo y pie.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ModalPortal } from "../../common/ModalPortal";
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { AuditTab } from "./AuditTab";
import { AutonomyFooter } from "./AutonomyFooter";
import { AutonomyHeader } from "./AutonomyHeader";
import { AutonomyRedLinesTab } from "./AutonomyRedLinesTab";
import { AutonomyTabNav } from "./AutonomyTabNav";
import { EmailDispatchTab } from "./EmailDispatchTab";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { ResponseStrategiesTab } from "./ResponseStrategiesTab";
import { SchedulesTab } from "./SchedulesTab";
import { ToneIdentityTab } from "./ToneIdentityTab";

/**
 * Maqueta del modal: portal, cabecera, pestañas, cuerpo y pie.
 * @returns Sección de interfaz.
 */
export function AutonomyLayout() {
  const { isOpen, onClose } = useAgentAutonomy();
  return (
    <>
      <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
      <div
        className={` rounded-[var(--r-l)] w-full max-w-4xl max-h-[88vh] md:max-h-[85vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200 ${"bg-[var(--surface)] text-[var(--ink)]"}`}
      >
        <AutonomyHeader />

        <AutonomyTabNav />

        <ReadOnlyBanner />

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AutonomyRedLinesTab />

          <EmailDispatchTab />

          <SchedulesTab />

          <ToneIdentityTab />

          <ResponseStrategiesTab />

          <AuditTab />
        </div>

        <AutonomyFooter />
      </div>
      </div>
    </ModalPortal>
    </>
  );
}
