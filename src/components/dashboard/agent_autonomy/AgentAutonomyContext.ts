/**
 * Contexto de la configuración de autonomía de agentes: reparte estado y acciones del controlador a las vistas.
 * Existe para que cada pestaña lea solo lo que usa, sin encadenar decenas de props desde el modal.
 */
import { createContext, useContext } from 'react';
import type { User } from '../../../types';
import type { AgentAutonomyConfig } from './autonomyTypes';
import type { useAgentAutonomyController } from './hooks/useAgentAutonomyController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type AgentAutonomyController = ReturnType<typeof useAgentAutonomyController>;

/** Props del modal que las vistas también necesitan. */
export interface AgentAutonomyHostProps {
  isOpen: boolean;
  onClose: () => void;
  bandName: string;
  bandId: string;
  currentUser?: User;
  initialConfig?: Partial<AgentAutonomyConfig>;
  onSaveConfig?: (config: AgentAutonomyConfig) => void;
  onOpenTemplatesSection?: () => void;
  onOpenBandProfile?: () => void;
}

/** Valor del contexto: controlador + props del modal. */
export type AgentAutonomyContextValue = AgentAutonomyController & AgentAutonomyHostProps;

export const AgentAutonomyContext = createContext<AgentAutonomyContextValue | null>(null);

/**
 * Lee el contexto de autonomía de agentes.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link AgentAutonomyProvider} (error de programación, falla rápido).
 */
export function useAgentAutonomy(): AgentAutonomyContextValue {
  const value = useContext(AgentAutonomyContext);
  if (!value) throw new Error('useAgentAutonomy debe usarse dentro de <AgentAutonomyProvider>');
  return value;
}

