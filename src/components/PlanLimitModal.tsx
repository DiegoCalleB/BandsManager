import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  X,
  Lock,
  Check,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  PlanDefinition,
  getPlanDefinition,
  normalizePlan,
  getPlanLimits,
} from "../utils/planPermissions";
import { CheckoutButton } from "./CheckoutButton";
import { User } from "../types";
import { ModalPortal } from "./common/ModalPortal";

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlanes: () => void;
  currentUser?: User;
  activeBandName?: string;
  resourceType: "leads" | "medios" | "fans" | "songs" | "bands";
  currentCount: number;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPlanes,
  currentUser,
  activeBandName,
  resourceType,
  currentCount,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );

  if (!isOpen) return null;

  const currentPlan = normalizePlan(currentUser?.plan || "ensayo");
  const currentPlanDef = getPlanDefinition(currentPlan);

  const resourceLabels: Record<
    string,
    {
      singular: string;
      plural: string;
      suggestedPlan: "local" | "de_gira" | "cabeza_de_cartel";
    }
  > = {
    leads: {
      singular: "sala de conciertos",
      plural: "salas de conciertos",
      suggestedPlan: "de_gira",
    },
    medios: {
      singular: "contacto de prensa",
      plural: "contactos de prensa",
      suggestedPlan: "de_gira",
    },
    fans: { singular: "fan", plural: "fans", suggestedPlan: "local" },
    songs: { singular: "canción", plural: "canciones", suggestedPlan: "local" },
    bands: {
      singular: "banda o proyecto",
      plural: "bandas o proyectos",
      suggestedPlan: "cabeza_de_cartel",
    },
  };

  const info = resourceLabels[resourceType] || {
    singular: "registro",
    plural: "registros",
    suggestedPlan: "de_gira",
  };
  const targetPlanDef = getPlanDefinition(info.suggestedPlan);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fade-in">
        <div className="relative w-full max-w-lg rounded-[var(--r-l)] bg-[var(--surface)] p-6 sm:p-8 space-y-6 text-[var(--ink)] font-sans my-auto max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-m)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-[var(--r-l)] bg-[var(--acc)]/15 text-[var(--acc)] shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-[var(--acc)] bg-[var(--acc)]/60 px-2 py-0.5 rounded-[var(--r-s)]">
                Límite de {currentPlanDef.name} alcanzado
              </span>
              <h3 className="text-xl font-bold font-display tracking-wide text-[var(--ink)] mt-1">
                Cupo de {info.plural} completado ({currentCount})
              </h3>
            </div>
          </div>

          {/* Non-destructive guarantee notice */}
          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/90 space-y-2">
            <div className="flex items-center gap-2 text-[var(--ok)] font-sans text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
              <span>Tus datos actuales están 100% seguros y protegidos</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Puedes consultar, editar, filtrar y exportar todas tus{" "}
              {currentCount} {info.plural} creadas sin ninguna limitación. Para
              añadir nuevas {info.plural}, mejora tu plan a{" "}
              <strong className="text-[var(--acc)]/70 font-semibold">
                {targetPlanDef.name}
              </strong>
              .
            </p>
          </div>

          {/* Recommended plan highlight */}
          <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]   space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                <span className="text-sm font-bold font-display text-[var(--acc)]/70">
                  Plan Recomendado: {targetPlanDef.name}
                </span>
              </div>
              <span className="text-xs font-sans text-[var(--ink-2)] font-bold bg-[var(--acc)]/60 px-2.5 py-0.5 rounded-[var(--r-pill)]">
                {targetPlanDef.badge}
              </span>
            </div>

            <p className="text-xs text-[var(--ink-2)]">
              {targetPlanDef.description}
            </p>

            <ul className="space-y-1.5 text-xs text-[var(--ink-2)]">
              {targetPlanDef.features.slice(0, 3).map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 stroke-[3]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <CheckoutButton
                planId={targetPlanDef.id}
                billingInterval={billingPeriod}
                bandId={currentUser?.band_id}
                userEmail={currentUser?.email}
                className="w-full py-3 px-4 rounded-[var(--r-m)] bg-[var(--acc)]  hover:bg-[var(--acc)] text-[var(--ink)] font-black text-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  Mejorar a {targetPlanDef.name} ({targetPlanDef.price})
                </span>
                <ArrowRight className="w-4 h-4" />
              </CheckoutButton>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans transition-colors cursor-pointer"
            >
              Continuar en {currentPlanDef.name}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToPlanes();
              }}
              className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70 text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Comparativa Completa</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
