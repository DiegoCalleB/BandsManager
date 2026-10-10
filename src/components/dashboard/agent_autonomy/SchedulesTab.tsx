/**
 * Pestaña de horarios y workflows de lectores y enviadores.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { AgentStatusMonitor } from "./AgentStatusMonitor";
import { BestDaysCard } from "./BestDaysCard";
import { ReaderAgentNote } from "./ReaderAgentNote";
import { SchedulePresetsBar } from "./SchedulePresetsBar";
import { SenderScheduleSection } from "./SenderScheduleSection";
import { TimezoneSelector } from "./TimezoneSelector";

/**
 * Pestaña de horarios y workflows de lectores y enviadores.
 * @returns Sección de interfaz.
 */
export function SchedulesTab() {
  const { activeTab,} = useAgentAutonomy();
  return (
    <>
      {/* TAB 4: HORARIOS & WORKFLOWS */}
      {activeTab === "schedules" && (
      <div className="space-y-6">
        <SchedulePresetsBar />

        <BestDaysCard />

        <TimezoneSelector />

        <SenderScheduleSection />

        <ReaderAgentNote />

        <AgentStatusMonitor />
      </div>
      )}
    </>
  );
}
