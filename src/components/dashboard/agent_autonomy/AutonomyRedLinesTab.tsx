/**
 * Pestaña de autonomía de los agentes y líneas rojas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { DispatchModeSection } from "./DispatchModeSection";
import { EconomicParamsSection } from "./EconomicParamsSection";
import { NegotiationScopeSection } from "./NegotiationScopeSection";
import { RedLineNotice } from "./RedLineNotice";
import { StartupChecklistCard } from "./StartupChecklistCard";

/**
 * Pestaña de autonomía de los agentes y líneas rojas.
 * @returns Sección de interfaz.
 */
export function AutonomyRedLinesTab() {
  const { activeTab,} = useAgentAutonomy();
  return (
    <>
      {/* TAB 1: AUTONOMÍA & LÍNEAS ROJAS */}
      {activeTab === "autonomy" && (
      <div className="space-y-6">
        <StartupChecklistCard />

        <RedLineNotice />

        <DispatchModeSection />

        <NegotiationScopeSection />

        <EconomicParamsSection />
      </div>
      )}
    </>
  );
}
