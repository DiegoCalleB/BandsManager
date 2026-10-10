/**
 * Vista de métricas sociales: radar de plataformas, gráfico, histórico y plan de crecimiento con IA.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `reels/metrics/` (AGENTS.md §5.6).
 */
import type { EPKConfig, Fan, SocialMetric, ThemeColors } from "../../types";
import { useReelsMetricsController } from "./metrics/hooks/useReelsMetricsController";
import { MetricsLayout } from "./metrics/MetricsLayout";
import { MetricsProvider } from "./metrics/MetricsProvider";

export interface ReelsMetricsViewProps {
  colors: ThemeColors;
  metrics: SocialMetric[];
  epkConfig?: Partial<EPKConfig>;
  currentBandName?: string;
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
  onScanRealMetrics?: () => Promise<void>;
  onSyncMetrics?: () => Promise<void>;
  isScanningMetrics?: boolean;
  isSyncingMetrics?: boolean;
  fans?: Fan[];
}

/**
 * Panel de métricas de redes de la banda activa.
 * @param props Métricas, fans, configuración EPK y callbacks de persistencia/sincronización.
 * @returns La vista completa con su contexto.
 */
export function ReelsMetricsView({
  metrics = [],
  isScanningMetrics = false,
  isSyncingMetrics = false,
  fans = [],
  ...props
}: ReelsMetricsViewProps) {
  const controller = useReelsMetricsController({
    currentBandName: props.currentBandName,
    epkConfig: props.epkConfig,
    fans,
    metrics,
    onScanRealMetrics: props.onScanRealMetrics,
    onSyncMetrics: props.onSyncMetrics,
    onUpdateMetric: props.onUpdateMetric,
    onAddMetric: props.onAddMetric,
  });

  return (
    <MetricsProvider value={{ ...controller, ...props, metrics, isScanningMetrics, isSyncingMetrics, fans }}>
      <MetricsLayout />
    </MetricsProvider>
  );
}
