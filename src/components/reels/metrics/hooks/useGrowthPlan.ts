/**
 * Generación del plan de crecimiento social a partir de las métricas.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { api } from "../../../../services/api";
import { EPKConfig, SocialMetric } from "../../../../types";
import { GrowthPlan, getDeterministicGrowthPlan } from "../../../../utils/growthPlanEngine";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface GrowthPlanParams {
  metrics: SocialMetric[];
  effectiveBandName: string;
  epkConfig: Partial<EPKConfig>;
}

/**
 * Generación del plan de crecimiento social a partir de las métricas.
 * @param params Estado y callbacks del contenedor ({@link GrowthPlanParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useGrowthPlan({ metrics, effectiveBandName, epkConfig }: GrowthPlanParams) {
  // Growth Plan State
  const [growthPlan, setGrowthPlan] = useState<GrowthPlan>(() => {
    const latest =
      [...metrics].sort(
        (a, b) =>
          new Date(b.fecha || "").getTime() - new Date(a.fecha || "").getTime(),
      )[0] || null;
    return getDeterministicGrowthPlan(effectiveBandName, latest, epkConfig, 30);
  });

  const [isGeneratingGrowthPlan, setIsGeneratingGrowthPlan] = useState(false);

  const handleRefreshGrowthPlanWithAI = async (
    horizon: 30 | 60 | 90 = 30,
    customFocus?: string,
  ) => {
    try {
      setIsGeneratingGrowthPlan(true);
      const latest =
        [...metrics].sort(
          (a, b) =>
            new Date(b.fecha || "").getTime() -
            new Date(a.fecha || "").getTime(),
        )[0] || null;
      const res = await api.generateSocialGrowthPlan({
        bandName: effectiveBandName,
        metrics: latest,
        epkConfig,
        horizonDays: horizon,
        customFocus,
      });
      if (res && res.success && res.data) {
        setGrowthPlan(res.data);
      } else {
        // Fallback to deterministic engine
        setGrowthPlan(
          getDeterministicGrowthPlan(
            effectiveBandName,
            latest,
            epkConfig,
            horizon,
          ),
        );
      }
    } catch (err) {
      console.warn(
        "Could not generate AI growth plan, using engine plan:",
        err,
      );
      const latest =
        [...metrics].sort(
          (a, b) =>
            new Date(b.fecha || "").getTime() -
            new Date(a.fecha || "").getTime(),
        )[0] || null;
      setGrowthPlan(
        getDeterministicGrowthPlan(
          effectiveBandName,
          latest,
          epkConfig,
          horizon,
        ),
      );
    } finally {
      setIsGeneratingGrowthPlan(false);
    }
  };

  return { growthPlan, handleRefreshGrowthPlanWithAI, isGeneratingGrowthPlan };
}
