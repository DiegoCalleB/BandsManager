import { FansPanelHeader } from "./FansPanelHeader";
const COLORS = [
  "var(--acc)",
  "var(--ok)",
  "var(--acc)",
  "var(--acc)",
  "var(--alert)",
  "var(--ok)",
  "var(--ink-2)",
];

/**
 * Cuerpo del panel de fans: cabecera, pestañas y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Heart,QrCode,TrendingUp,Users } from "lucide-react";
import { THEMES } from "../../utils/theme";
import { FansLandingPreviewModal } from "../FansLandingPreviewModal";
import { ModuleTutorialModal } from "../common/ModuleTutorialModal";
import { FansDashboardView } from "../fans/FansDashboardView";
import { ReelsMetricsView } from "../reels/ReelsMetricsView";
import { Tabs } from "../ui/Tabs";
import { FansAddModal } from "./FansAddModal";
import { FansListTab } from "./FansListTab";
import { useFansPanel } from "./FansPanelContext";
import { FansQrTab } from "./FansQrTab";

/**
 * Cuerpo del panel de fans: cabecera, pestañas y modales.
 * @returns Sección de interfaz.
 */
export function FansPanelBody() {
  const { setShowFansPreviewModal, activeTab, setActiveTab, isPromo, fans, clickStats, effectiveBandName, evolutionaryGrowthData, originData, colors, metrics, epkConfig, onAddMetric, onUpdateMetric, onDeleteMetric, onScanRealMetrics, onSyncMetrics, isScanningMetrics, isSyncingMetrics, showFansPreviewModal, currentBandId, effectiveBandLogo, concerts, selectedConcertId, qrLanguage, isTutorialOpen, closeTutorial } = useFansPanel();
  return (
    <>
<div data-modulo="fans" className="space-y-6">
      <FansPanelHeader />

      <Tabs<typeof activeTab>
        className="pin-top"
        aria-label="Secciones de fans"
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: "metrics", domId: "tab-btn-fans-metrics", icon: TrendingUp, label: "1. Seguimiento y métricas de redes", hidden: isPromo },
          { id: "qr", domId: "tab-btn-fans-qr", icon: QrCode, label: `${isPromo ? 1 : 2}. Captura en Vivo y QR` },
          { id: "dashboard", domId: "tab-btn-fans-dashboard", icon: Heart, label: `${isPromo ? 2 : 3}. Dashboard y Analítica` },
          { id: "fans", domId: "tab-btn-fans-directory", icon: Users, label: `${isPromo ? 3 : 4}. Comunidad y Red Social (${fans.length})` },
        ]}
      />

      {activeTab === "dashboard" && (
        <FansDashboardView
          fans={fans}
          clickStats={clickStats}
          effectiveBandName={effectiveBandName}
          evolutionaryGrowthData={evolutionaryGrowthData}
          originData={originData}
          COLORS={COLORS}
        />
      )}

      <FansListTab />

      <FansQrTab />

      {activeTab === "metrics" && (
        <div className="space-y-6">
          <ReelsMetricsView
            colors={colors || THEMES.indie_velvet}
            metrics={metrics || []}
            epkConfig={epkConfig}
            currentBandName={effectiveBandName}
            onAddMetric={onAddMetric}
            onUpdateMetric={onUpdateMetric}
            onDeleteMetric={onDeleteMetric}
            onScanRealMetrics={onScanRealMetrics}
            onSyncMetrics={onSyncMetrics}
            isScanningMetrics={isScanningMetrics}
            isSyncingMetrics={isSyncingMetrics}
            fans={fans}
          />
        </div>
      )}

      <FansAddModal />

      {/* Modal Simulador / Vista Previa In-App del Formulario Únete */}
      <FansLandingPreviewModal
        isOpen={showFansPreviewModal}
        onClose={() => setShowFansPreviewModal(false)}
        currentBandId={currentBandId}
        currentBandName={effectiveBandName}
        currentBandLogo={effectiveBandLogo}
        epkConfig={epkConfig}
        concerts={concerts}
        initialConcertId={selectedConcertId}
        initialLanguage={qrLanguage}
      />

      {/* Tutorial Interactivo Paso a Paso */}
      <ModuleTutorialModal
        moduleId="fans"
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </div>
    </>
  );
}
