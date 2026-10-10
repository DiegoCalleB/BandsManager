/**
 * Altas de leads y fans con control de límites del plan.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import type { Fan } from "../../types";
import { Lead } from "../../types";
import { checkRecordLimit } from "../../utils/planPermissions";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PlanLimitGuardsParams {
  leads: Lead[];
  currentActiveBandPlan: "promo" | "promo_plus" | "ensayo" | "local" | "de_gira" | "cabeza_de_cartel";
  handleAddLead: (newLead: Lead) => Promise<void>;
  fans: Fan[];
  handleAddFan: (fan: Fan) => Promise<void>;
}

/**
 * Altas de leads y fans con control de límites del plan.
 * @param params Estado y callbacks del contenedor ({@link PlanLimitGuardsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlanLimitGuards({ leads, currentActiveBandPlan, handleAddLead, fans, handleAddFan }: PlanLimitGuardsParams) {
  // Soft Limit Modal State
  const [planLimitModal, setPlanLimitModal] = useState<{
    isOpen: boolean;
    resourceType: "leads" | "medios" | "fans" | "songs" | "bands";
    currentCount: number;
  }>({
    isOpen: false,
    resourceType: "leads",
    currentCount: 0,
  });

  // Guarded Handlers respecting Band Contracted Plan Limits
  const handleAddLeadWithLimitCheck = async (newLead: Lead) => {
    const isMedio =
      newLead.tipo === "medio" ||
      String(newLead.tipo || "")
        .toLowerCase()
        .includes("prensa") ||
      String(newLead.tipo || "")
        .toLowerCase()
        .includes("radio");
    const currentCount = isMedio
      ? leads.filter(
          (l) =>
            String(l.tipo || "")
              .toLowerCase()
              .includes("medio") ||
            String(l.tipo || "")
              .toLowerCase()
              .includes("radio") ||
            String(l.tipo || "")
              .toLowerCase()
              .includes("prensa"),
        ).length
      : leads.filter(
          (l) =>
            !String(l.tipo || "")
              .toLowerCase()
              .includes("medio") &&
            !String(l.tipo || "")
              .toLowerCase()
              .includes("radio") &&
            !String(l.tipo || "")
              .toLowerCase()
              .includes("prensa"),
        ).length;

    const limitCheck = checkRecordLimit(
      currentActiveBandPlan,
      isMedio ? "medios" : "leads",
      currentCount,
    );
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: isMedio ? "medios" : "leads",
        currentCount,
      });
      return;
    }
    return handleAddLead(newLead);
  };

  const handleAddFanWithLimitCheck = async (fanData: Fan) => {
    const currentCount = fans.length;
    const limitCheck = checkRecordLimit(
      currentActiveBandPlan,
      "fans",
      currentCount,
    );
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: "fans",
        currentCount,
      });
      return;
    }
    return handleAddFan(fanData);
  };

  return { handleAddLeadWithLimitCheck, handleAddFanWithLimitCheck, planLimitModal, setPlanLimitModal };
}
