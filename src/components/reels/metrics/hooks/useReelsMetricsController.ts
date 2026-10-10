/**
 * Compone los hooks de la vista de métricas (resumen, gráfico, plan de crecimiento, Instagram, capturas y formulario).
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig, Fan, SocialMetric } from "../../../../types";
import { useContentItems } from "./useContentItems";
import { useGrowthPlan } from "./useGrowthPlan";
import { useInstagramConnection } from "./useInstagramConnection";
import { useMetricForm } from "./useMetricForm";
import { useMetricsChart } from "./useMetricsChart";
import { useMetricsSummary } from "./useMetricsSummary";
import { useScreenshotScan } from "./useScreenshotScan";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ReelsMetricsControllerParams {
  currentBandName: string;
  epkConfig: Partial<EPKConfig>;
  fans: Fan[];
  metrics: SocialMetric[];
  onScanRealMetrics: () => Promise<void>;
  onSyncMetrics: () => Promise<void>;
  onUpdateMetric: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
  onAddMetric: (metric: SocialMetric) => Promise<void>;
}

/**
 * Compone los hooks de la vista de métricas (resumen, gráfico, plan de crecimiento, Instagram, capturas y formulario).
 * @param params Estado y callbacks del contenedor ({@link ReelsMetricsControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useReelsMetricsController({ currentBandName, epkConfig, fans, metrics, onScanRealMetrics, onSyncMetrics, onUpdateMetric, onAddMetric }: ReelsMetricsControllerParams) {
  // Main Section Switch: Metrics Dashboard vs Growth Plan
  const [activeMainSection, setActiveMainSection] = useState<
    "metrics" | "growth_plan"
  >("metrics");

  const effectiveBandName =
    currentBandName || epkConfig?.contactoBooking?.nombre || "Tu Banda";

  const { filteredSortedMetrics, sortedMetrics, selectedPeriod, latestMetric, hasInstagram, hasTikTok, hasYouTube, hasSpotify, fansTotalCount, setSelectedChannels, selectedChannels, hasFans, uneteFansCount, PERIOD_OPTIONS, setSelectedPeriod, currentPeriodOption } = useMetricsSummary({ fans, metrics, epkConfig });

  const { gridColsClass, yAxisDomain, selectAllChannels, periodSummaryStats, toggleChannel, selectOnlyChannel, curveSeries, activeCount } = useMetricsChart({ filteredSortedMetrics, sortedMetrics, selectedPeriod, latestMetric, hasInstagram, hasTikTok, hasYouTube, hasSpotify, fansTotalCount, setSelectedChannels, selectedChannels, hasFans });

  const { loadContentItems, contentItems } = useContentItems();

  const { growthPlan, handleRefreshGrowthPlanWithAI, isGeneratingGrowthPlan } = useGrowthPlan({ metrics, effectiveBandName, epkConfig });

  const { setIgModalMsg, setShowIgModal, igStatus, showIgModal, handleDisconnectIg, isConnectingIg, igModalMsg, igTokenInput, setIgTokenInput, handleConnectIgToken } = useInstagramConnection({ loadContentItems, onScanRealMetrics });

  const { setScanError, setScanSuccess, setScanResult, setShowScanModal, showScanModal, scanError, scanSuccess, scanImageBase64, handleScreenshotInputChange, handleAnalyzeScreenshot, isAnalyzingScreenshot, scanResult, setScanImageBase64 } = useScreenshotScan({ onSyncMetrics });

  const { metricSuccess, editingMetricId, handleSaveMetric, metricDate, setMetricDate, metricInsta, setMetricInsta, metricTiktok, setMetricTiktok, metricYoutube, setMetricYoutube, metricSpotify, setMetricSpotify, setShowAdvancedFields, showAdvancedFields, metricSpotifyFollowers, setMetricSpotifyFollowers, metricSpotifyPopularity, setMetricSpotifyPopularity, metricYtViews, setMetricYtViews, metricTkLikes, setMetricTkLikes, metricNotes, setMetricNotes, isSavingMetric, handleCancelEditMetric, handleEditMetricClick } = useMetricForm({ onUpdateMetric, onAddMetric });

  return { activeMainSection, setActiveMainSection, effectiveBandName, latestMetric, growthPlan, handleRefreshGrowthPlanWithAI, isGeneratingGrowthPlan, setScanError, setScanSuccess, setScanResult, setShowScanModal, setIgModalMsg, setShowIgModal, igStatus, loadContentItems, metricSuccess, gridColsClass, hasInstagram, hasTikTok, hasYouTube, contentItems, hasSpotify, hasFans, fansTotalCount, uneteFansCount, yAxisDomain, PERIOD_OPTIONS, selectedPeriod, setSelectedPeriod, selectAllChannels, periodSummaryStats, currentPeriodOption, selectedChannels, toggleChannel, selectOnlyChannel, curveSeries, editingMetricId, handleSaveMetric, metricDate, setMetricDate, metricInsta, setMetricInsta, metricTiktok, setMetricTiktok, metricYoutube, setMetricYoutube, metricSpotify, setMetricSpotify, setShowAdvancedFields, showAdvancedFields, metricSpotifyFollowers, setMetricSpotifyFollowers, metricSpotifyPopularity, setMetricSpotifyPopularity, metricYtViews, setMetricYtViews, metricTkLikes, setMetricTkLikes, metricNotes, setMetricNotes, isSavingMetric, handleCancelEditMetric, activeCount, handleEditMetricClick, showIgModal, handleDisconnectIg, isConnectingIg, igModalMsg, igTokenInput, setIgTokenInput, handleConnectIgToken, showScanModal, scanError, scanSuccess, scanImageBase64, handleScreenshotInputChange, handleAnalyzeScreenshot, isAnalyzingScreenshot, scanResult, setScanImageBase64 };
}
