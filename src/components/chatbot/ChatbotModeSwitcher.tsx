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
          ? 'bg-[var(--acc)] text-[var(--on-acc)] border-b border-[var(--hair)]'
          : 'bg-[var(--ok)] text-[var(--on-ok)] border-b border-[var(--ok)]/30'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-[var(--r-pill)] shrink-0 ${agentsEnabled ? 'bg-[var(--acc)]' : 'bg-[var(--ok)]'}`} />
        <span className="font-bold truncate text-xs">
          {agentsEnabled ? 'Agentes Supabase Activos (Backend y Database)' : 'Modo Gemini Directo (100% Autónomo)'}
        </span>
        <span className="text-micro opacity-75 hidden sm:inline truncate">
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
            className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-bold transition-ui cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-[0.97] ${
              'bg-[var(--acc-soft)] hover:bg-[var(--acc)] text-[var(--acc)] '
            }`}
            title="Configurar niveles de autonomía y negociación de los agentes AI (Solo Administradores)"
          >
            <Sliders className="w-3 h-3 text-[var(--acc)]" />
            <span>Niveles de autonomía</span>
            <span className="px-1 py-0.2 rounded text-micro bg-[var(--acc)] text-[var(--on-acc)] font-bold">ADMIN</span>
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
          className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-bold transition-ui cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-[0.97] ${
            agentsEnabled
              ? 'bg-[var(--acc-soft)] hover:bg-[var(--acc)]/15 text-[var(--acc)] '
              : 'bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] '
          }`}
          title={agentsEnabled ? 'Desactivar motor de agentes de Supabase y usar solo Gemini' : 'Activar motor de agentes en Supabase'}
        >
          <span>{agentsEnabled ? 'Desactivar Agentes Supabase' : 'Activar Agentes Supabase'}</span>
        </button>
      </div>
    </div>
  );
};
