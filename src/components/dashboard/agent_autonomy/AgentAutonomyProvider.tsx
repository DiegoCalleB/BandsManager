import type { ReactNode } from 'react';
import { AgentAutonomyContext, type AgentAutonomyContextValue } from './AgentAutonomyContext';

/**
 * Proveedor del contexto de autonomía de agentes.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function AgentAutonomyProvider({ value, children }: { value: AgentAutonomyContextValue; children: ReactNode }) {
  return <AgentAutonomyContext.Provider value={value}>{children}</AgentAutonomyContext.Provider>;
}
