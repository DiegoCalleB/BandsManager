/**
 * Raíz de vistas del visor de repertorio: repertorio vacío, modo descanso o pantalla principal.
 * @returns La pantalla que corresponde al estado actual.
 */
import { PerformanceEmptyState } from "./PerformanceEmptyState";
import { PerformanceRestScreen } from "./PerformanceRestScreen";
import { useSetlistPerformance } from "./SetlistPerformanceContext";
import { SetlistPerformanceStage } from "./SetlistPerformanceStage";

export function SetlistPerformanceRoot() {
  const { currentItem, isResting } = useSetlistPerformance();
  if (!currentItem) return <PerformanceEmptyState />;
  if (isResting) return <PerformanceRestScreen />;
  return <SetlistPerformanceStage />;
}
