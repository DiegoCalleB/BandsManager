/**
 * Maqueta de la vista de métricas: pestañas, radar, gráfico, formulario, historial y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BarChart3, Compass } from "lucide-react";
import { Tabs } from "../../ui/Tabs";
import { SocialGrowthPlanView } from "../SocialGrowthPlanView";
import { ContentVideosSection } from "./ContentVideosSection";
import { FansCard } from "./FansCard";
import { InstagramCard } from "./InstagramCard";
import { InstagramConnectionModal } from "./InstagramConnectionModal";
import { MetricFormCard } from "./MetricFormCard";
import { MetricsChartSection } from "./MetricsChartSection";
import { useMetrics } from "./MetricsContext";
import { MetricsHistoryTable } from "./MetricsHistoryTable";
import { PlatformsRadarHeader } from "./PlatformsRadarHeader";
import { ScreenshotScanModal } from "./ScreenshotScanModal";
import { SpotifyCard } from "./SpotifyCard";
import { TikTokCard } from "./TikTokCard";
import { YouTubeCard } from "./YouTubeCard";

/**
 * Maqueta de la vista de métricas: pestañas, radar, gráfico, formulario, historial y modales.
 * @returns Sección de interfaz.
 */
export function MetricsLayout() {
  const { activeMainSection, setActiveMainSection, effectiveBandName, colors, latestMetric, epkConfig, growthPlan, handleRefreshGrowthPlanWithAI, isGeneratingGrowthPlan, gridColsClass } = useMetrics();
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Primary Module Navigation Tabs: Analytics Radar vs AI Growth Plan */}
      <div className="flex items-center justify-between gap-3  pb-3 flex-wrap">
      <Tabs<typeof activeMainSection>
        aria-label="Vistas de métricas"
        value={activeMainSection}
        onChange={setActiveMainSection}
        items={[
          { id: "metrics", icon: BarChart3, label: "Panel de métricas y radar" },
          { id: "growth_plan", icon: Compass, label: <>Plan y recomendaciones de crecimiento <span className="rounded-[var(--r-pill)] bg-[var(--acc)] px-1.5 py-0.5 text-micro font-medium text-[var(--on-acc)]">IA</span></> },
        ]}
      />

      {activeMainSection === "growth_plan" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-[var(--ink-2)]">
            Estrategia personalizada para{" "}
            <b className="text-[var(--acc)]">{effectiveBandName}</b>
          </span>
        </div>
      )}
      </div>

      {activeMainSection === "growth_plan" ? (
      <SocialGrowthPlanView
        colors={colors}
        bandName={effectiveBandName}
        latestMetric={latestMetric}
        epkConfig={epkConfig}
        growthPlan={growthPlan}
        onRefreshPlanWithAI={handleRefreshGrowthPlanWithAI}
        isGeneratingAI={isGeneratingGrowthPlan}
      />
      ) : (
      <>
        <PlatformsRadarHeader />

        {/* 1. Specialized Multi-Platform Deep Analytics Grid */}
        <div className={`grid ${gridColsClass} gap-4`}>
          <InstagramCard />

          <TikTokCard />

          <YouTubeCard />

          <SpotifyCard />

          <FansCard />
        </div>

        {/* 2. Recharts Dynamic Adaptive Area Chart */}
        <MetricsChartSection />

        <ContentVideosSection />

        {/* 4. Formulario de Checkpoint & Tabla Histórica */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <MetricFormCard />

          <MetricsHistoryTable />
        </div>
      </>
      )}

      {/* 4. Instagram Meta Graph API & OAuth Connection Modal */}
      <InstagramConnectionModal />

      {/* 5. GEMINI MULTIMODAL SCREENSHOT SCANNER MODAL */}
      <ScreenshotScanModal />
    </div>
    </>
  );
}
