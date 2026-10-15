import { FansCityTabsBar } from "./FansCityTabsBar";
import { FansGridView } from "./FansGridView";
import { FansMapView } from "./FansMapView";
import { FansTableView } from "./FansTableView";
import { FansToolbar } from "./FansToolbar";
/**
 * Pestaña de fans: filtros, listado y mapa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { FansCommunityView } from "../fans/FansCommunityView";
import { useFansPanel } from "./FansPanelContext";

/**
 * Pestaña de fans: filtros, listado y mapa.
 * @returns Sección de interfaz.
 */
export function FansListTab() {
  const { activeTab, selectedCityFilter, viewMode, filteredFans, concerts, effectiveBandName, effectiveBandLogo, colors, onUpdateFan, onDeleteFan, setShowAddModal } = useFansPanel();
  return (
    <>
{activeTab === "fans" && (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-5">
          <FansCityTabsBar />

          <FansToolbar />

          {viewMode === "feed" && (
            <FansCommunityView
              fans={filteredFans}
              concerts={concerts}
              effectiveBandName={effectiveBandName}
              effectiveBandLogo={effectiveBandLogo}
              colors={colors}
              onUpdateFan={onUpdateFan}
              onDeleteFan={onDeleteFan}
              onOpenAddModal={() => setShowAddModal(true)}
              selectedCityFilter={selectedCityFilter}
            />
          )}

          <FansGridView />

          <FansMapView />

          <FansTableView />
        </div>
      )}
    </>
  );
}
