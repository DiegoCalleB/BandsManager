import React from 'react';
import { Sliders } from 'lucide-react';

export interface ChatbotModeSwitcherProps {
  agentsEnabled: boolean;
  onToggleAgents: (val: boolean) => void;
  isAdmin: boolean;
  onOpenAutonomyModal: () => void;
  isStitchLight: boolean;
}

export const ChatbotModeSwitcher: React.FC<ChatbotModeSwitcherProps> = ({
  agentsEnabled,
  onToggleAgents,
  isAdmin,
  onOpenAutonomyModal,
  isStitchLight,
}) => {
  return (
    <div
      className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors ${
        agentsEnabled
          ? isStitchLight
            ? 'bg-amber-50/80 text-amber-900 border-b border-[var(--acc)]/80'
            : 'bg-amber-500/10 text-amber-300 border-b border-[var(--acc)]/20'
          : isStitchLight
            ? 'bg-emerald-50/80 text-emerald-900 border-b border-[var(--ok)]/80'
            : 'bg-emerald-500/10 text-emerald-300 border-b border-[var(--ok)]/20'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${agentsEnabled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span className="font-bold truncate text-[11px] uppercase tracking-wider">
          {agentsEnabled ? '⚡ Agentes Supabase Activos (Backend & Database)' : '🤖 Modo Gemini Directo (100% Autónomo)'}
        </span>
        <span className="text-[10px] opacity-75 hidden sm:inline truncate">
          {agentsEnabled
            ? '— Ejecuta agentes (Scout, Redactor, Enviador, Lector) en Supabase'
            : '— Asistencia, redacción y consultas directas con Gemini'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isAdmin && (
          <button
            id="open-autonomy-config-btn"
            type="button"
            onClick={onOpenAutonomyModal}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ${
              isStitchLight
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-[var(--acc)]'
                : 'bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-[var(--acc)]/50'
            }`}
            title="Configurar niveles de autonomía y negociación de los agentes AI (Solo Administradores)"
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>Niveles de Autonomía</span>
            <span className="px-1 py-0.2 rounded text-[8px] bg-purple-500/50 text-white font-black">ADMIN</span>
          </button>
        )}

        <button
          id="toggle-agents-switch"
          type="button"
          onClick={() => {
            const nextVal = !agentsEnabled;
            onToggleAgents(nextVal);
            localStorage.setItem('bakandeya_agents_enabled', String(nextVal));
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ${
            agentsEnabled
              ? isStitchLight
                ? 'bg-amber-200 hover:bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]'
                : 'bg-amber-500/20 hover:bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/40'
              : isStitchLight
                ? 'bg-emerald-200 hover:bg-[#10b981]/15 text-[#10b981] border border-[var(--ok)]'
                : 'bg-emerald-500/20 hover:bg-[#10b981]/15 text-[#10b981] border border-[var(--ok)]/40'
          }`}
          title={agentsEnabled ? 'Desactivar motor de agentes de Supabase y usar solo Gemini' : 'Activar motor de agentes en Supabase'}
        >
          <span>{agentsEnabled ? 'Desactivar Agentes Supabase' : 'Activar Agentes Supabase'}</span>
        </button>
      </div>
    </div>
  );
};
