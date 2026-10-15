/**
 * Panel de fans: métricas, listado, QR de la landing, incentivos y alta manual.
 * Orquesta controlador, contexto y vista; la lógica vive en `fans_panel/` (AGENTS.md §5.6).
 */
import React from "react";
import type { Concert,EPKConfig,Fan,SocialMetric,ThemeColors } from "../types";
import { FansPanelProvider } from "./fans_panel/FansPanelProvider";
import { FansPanelBody } from "./fans_panel/FansPanelBody";
import { useFansPanelController } from "./fans_panel/hooks/useFansPanelController";

export interface FansPanelProps {
  fans: Fan[];
  concerts: Concert[];
  epkConfig: Partial<EPKConfig>;
  onAddFan: (fan: Fan) => void;
  onDeleteFan: (id: string) => void;
  onUpdateFan?: (id: string, updates: Partial<Fan>) => void;
  onUpdateIncentive?: (newIncentive: EPKConfig["incentivoFans"]) => void;
  onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
  metrics?: SocialMetric[];
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (
    id: string,
    updatedFields: Partial<SocialMetric>,
  ) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
  onScanRealMetrics?: () => Promise<void>;
  onSyncMetrics?: () => Promise<void>;
  isScanningMetrics?: boolean;
  isSyncingMetrics?: boolean;
  colors?: ThemeColors;
  onNavigate?: (view: "epk") => void;
  isPromo?: boolean;
  onUpdateConcert?: (id: string, updates: Partial<Concert>) => void;
  initialConcertId?: string;
}

/**
 * Panel de fans de la banda activa.
 * @param props Fans, conciertos, EPK, métricas y callbacks de persistencia/navegación.
 * @returns El panel completo con su contexto.
 */
export const FansPanel: React.FC<FansPanelProps> = ({ fans = [], concerts = [], metrics = [], isPromo = false, ...props }) => {
  const controller = useFansPanelController({
    currentBandName: props.currentBandName,
    epkConfig: props.epkConfig,
    currentBandLogo: props.currentBandLogo,
    currentBandId: props.currentBandId,
    initialConcertId: props.initialConcertId,
    isPromo,
    onUpdateIncentive: props.onUpdateIncentive,
    onUpdateEpkConfig: props.onUpdateEpkConfig,
    fans,
    concerts,
    onAddFan: props.onAddFan,
  });

  return (
    <FansPanelProvider value={{ ...controller, ...props, fans, concerts, metrics, isPromo }}>
      <FansPanelBody />
    </FansPanelProvider>
  );
};

export default FansPanel;
