/**
 * Plan efectivo de la banda activa y si el usuario está en un plan promocional.
 * Extraído de UserProfileModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { User } from "../../../types";
import { getPlanDefinition,normalizePlan } from "../../../utils/planPermissions";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PlanSummaryParams {
  availableBands: { band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean; }[];
  currentUser: User;
}

/**
 * Plan efectivo de la banda activa y si el usuario está en un plan promocional.
 * @param params Estado y callbacks del contenedor ({@link PlanSummaryParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlanSummary({ availableBands, currentUser }: PlanSummaryParams) {
  const activeBandMatch = availableBands?.find(
    (b) =>
      b.band_id === (currentUser.band_id || currentUser.main_band_id) ||
      (b as { id?: string }).id === (currentUser.band_id || currentUser.main_band_id),
  );

  const effectivePlan = activeBandMatch?.plan || currentUser.plan;

  const currentPlanDef = getPlanDefinition(effectivePlan);

  const isHighestPlan = currentPlanDef.id === "cabeza_de_cartel";

  // Plan Promo y Promo+ (fase beta, festivales): sin agentes IA ni cambio de plan visible.
  const isPromoUser =
    normalizePlan(effectivePlan) === "promo" ||
    normalizePlan(effectivePlan) === "promo_plus";

  return { currentPlanDef, isHighestPlan, isPromoUser };
}
