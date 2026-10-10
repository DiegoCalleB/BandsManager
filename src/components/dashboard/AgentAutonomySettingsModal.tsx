/**
 * Modal de autonomía de agentes: modo de envío, líneas rojas, horarios, estrategias y auditoría.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `agent_autonomy/` (AGENTS.md §5.6).
 */
import React from "react";
import type { User } from "../../types";
import { AgentAutonomyProvider } from "./agent_autonomy/AgentAutonomyProvider";
import { AutonomyLayout } from "./agent_autonomy/AutonomyLayout";
import {
DAYS_OF_WEEK,
type AgentAutonomyConfig,
type DispatchAutonomyLevel,
type NegotiationDepthLevel,
} from "./agent_autonomy/autonomyTypes";
import { useAgentAutonomyController } from "./agent_autonomy/hooks/useAgentAutonomyController";

export { DAYS_OF_WEEK };
export type { AgentAutonomyConfig,DispatchAutonomyLevel,NegotiationDepthLevel };

interface AgentAutonomySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  bandId?: string;
  currentUser?: User;
  initialConfig?: Partial<AgentAutonomyConfig>;
  onSaveConfig?: (config: AgentAutonomyConfig) => void;
  onOpenTemplatesSection?: () => void;
  /**
   * Navega a Gestión de Banda (BandCRM), donde vive el ADN de Tono (BandToneModal) y el EPK.
   * Opcional porque no todos los sitios que abren este modal saben navegar fuera de su pantalla.
   */
  onOpenBandProfile?: () => void;
}

/**
 * Configuración de autonomía de los agentes de la banda activa.
 * @param props Visibilidad, banda, usuario y callbacks de guardado/navegación.
 * @returns El modal o `null` si está cerrado.
 */
export const AgentAutonomySettingsModal: React.FC<AgentAutonomySettingsModalProps> = ({
  isOpen,
  onClose,
  bandName = "Tu Banda",
  bandId = "band-bakandeya",
  currentUser,
  initialConfig,
  onSaveConfig,
  onOpenTemplatesSection,
  onOpenBandProfile,
}) => {
  const controller = useAgentAutonomyController({ currentUser, bandId, initialConfig, bandName, isOpen, onSaveConfig, onClose });

  if (!isOpen) return null;

  return (
    <AgentAutonomyProvider
      value={{ ...controller, isOpen, onClose, bandName, bandId, currentUser, initialConfig, onSaveConfig, onOpenTemplatesSection, onOpenBandProfile }}
    >
      <AutonomyLayout />
    </AgentAutonomyProvider>
  );
};
