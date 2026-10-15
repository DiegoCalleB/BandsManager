import { Sliders } from 'lucide-react';
import React from 'react';
import { Button } from '../ui';

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
}) => {
  return (
    <div
      className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
        'bg-[var(--sunken)] text-[var(--ink)]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-[var(--r-pill)] shrink-0 ${agentsEnabled ? 'bg-[var(--acc)]' : 'bg-[var(--ok)]'}`} aria-hidden />
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
          <Button
            variant="neutral"
            size="xs"
            id="open-autonomy-config-btn"
            type="button"
            onClick={onOpenAutonomyModal}
            className="items-center gap-1.5 shrink-0"
            title="Configurar niveles de autonomía y negociación de los agentes AI (Solo Administradores)"
          >
            <Sliders className="w-3 h-3 text-[var(--acc-ink)]" />
            <span>Niveles de autonomía</span>
            <span className="px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold">ADMIN</span>
          </Button>
        )}

        <Button
          variant={agentsEnabled ? "soft" : "primary"}
          size="xs"
          id="toggle-agents-switch"
          type="button"
          onClick={() => {
            const nextVal = !agentsEnabled;
            onToggleAgents(nextVal);
            localStorage.setItem('bandmanager_agents_enabled', String(nextVal));
          }}
          className="items-center gap-1.5 shrink-0"
          title={agentsEnabled ? 'Desactivar motor de agentes de Supabase y usar solo Gemini' : 'Activar motor de agentes en Supabase'}
        >
          <span>{agentsEnabled ? 'Desactivar Agentes Supabase' : 'Activar Agentes Supabase'}</span>
        </Button>
      </div>
    </div>
  );
};
