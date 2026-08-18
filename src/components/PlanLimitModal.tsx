import React, { useState } from 'react';
import { ShieldCheck, Sparkles, X, Lock, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { PlanDefinition, getPlanDefinition, normalizePlan, getPlanLimits } from '../utils/planPermissions';
import { CheckoutButton } from './CheckoutButton';
import { User } from '../types';
import { ModalPortal } from './common/ModalPortal';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlanes: () => void;
  currentUser?: User;
  activeBandName?: string;
  resourceType: 'leads' | 'medios' | 'fans' | 'songs' | 'bands';
  currentCount: number;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPlanes,
  currentUser,
  activeBandName,
  resourceType,
  currentCount
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const currentPlan = normalizePlan(currentUser?.plan || 'ensayo');
  const currentPlanDef = getPlanDefinition(currentPlan);

  const resourceLabels: Record<string, { singular: string; plural: string; suggestedPlan: 'local' | 'de_gira' | 'cabeza_de_cartel' }> = {
    leads: { singular: 'sala de conciertos', plural: 'salas de conciertos', suggestedPlan: 'de_gira' },
    medios: { singular: 'contacto de prensa', plural: 'contactos de prensa', suggestedPlan: 'de_gira' },
    fans: { singular: 'fan', plural: 'fans', suggestedPlan: 'local' },
    songs: { singular: 'canción', plural: 'canciones', suggestedPlan: 'local' },
    bands: { singular: 'banda o proyecto', plural: 'bandas o proyectos', suggestedPlan: 'cabeza_de_cartel' }
  };

  const info = resourceLabels[resourceType] || { singular: 'registro', plural: 'registros', suggestedPlan: 'de_gira' };
  const targetPlanDef = getPlanDefinition(info.suggestedPlan);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fade-in">
        <div className="relative w-full max-w-lg rounded-3xl bg-[#141312] border border-[#333130] p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100 font-sans my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              Límite de {currentPlanDef.name} alcanzado
            </span>
            <h3 className="text-xl font-bold font-display uppercase tracking-wide text-zinc-100 mt-1">
              Cupo de {info.plural} completado ({currentCount})
            </h3>
          </div>
        </div>

        {/* Non-destructive guarantee notice */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tus datos actuales están 100% seguros y protegidos</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Puedes consultar, editar, filtrar y exportar todas tus {currentCount} {info.plural} creadas sin ninguna limitación. Para añadir nuevas {info.plural}, mejora tu plan a <strong className="text-amber-300 font-semibold">{targetPlanDef.name}</strong>.
          </p>
        </div>

        {/* Recommended plan highlight */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1c1a18] to-[#141312] border-2 border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold font-display uppercase tracking-wider text-amber-300">
                Plan Recomendado: {targetPlanDef.name}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-300 font-bold bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
              {targetPlanDef.badge}
            </span>
          </div>

          <p className="text-xs text-neutral-300">
            {targetPlanDef.description}
          </p>

          <ul className="space-y-1.5 text-xs text-neutral-300">
            {targetPlanDef.features.slice(0, 3).map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[3]" />
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Mejorar a {targetPlanDef.name} ({targetPlanDef.price})</span>
              <ArrowRight className="w-4 h-4" />
            </CheckoutButton>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
          >
            Continuar en {currentPlanDef.name}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToPlanes();
            }}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-mono font-bold border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
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
