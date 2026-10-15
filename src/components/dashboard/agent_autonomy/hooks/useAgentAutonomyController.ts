/**
 * Compone los hooks de auditoría, estrategias de respuesta y configuración de autonomía de los agentes.
 * Extraído de AgentAutonomySettingsModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { User } from "../../../../types";
import { useState } from "react";
import { AgentAutonomyConfig } from "../autonomyTypes";
import { useAutonomyAuditLogs } from "./useAutonomyAuditLogs";
import { useAutonomyConfig } from "./useAutonomyConfig";
import { useResponseStrategies } from "./useResponseStrategies";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AgentAutonomyControllerParams {
  currentUser?: User;
  bandId: string;
  initialConfig: Partial<AgentAutonomyConfig>;
  bandName: string;
  isOpen: boolean;
  onSaveConfig: (config: AgentAutonomyConfig) => void;
  onClose: () => void;
}

/**
 * Compone los hooks de auditoría, estrategias de respuesta y configuración de autonomía de los agentes.
 * @param params Estado y callbacks del contenedor ({@link AgentAutonomyControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAgentAutonomyController({ currentUser, bandId, initialConfig, bandName, isOpen, onSaveConfig, onClose }: AgentAutonomyControllerParams) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    | "autonomy"
    | "email_dispatch"
    | "schedules"
    | "tone"
    | "response_strategies"
    | "audit_logs"
  >("autonomy");

  // RBAC Permission Check
  // `role` se compara como string: llegan roles heredados ("manager", "director") fuera del tipo User.
  const role: string | undefined = currentUser?.role;
  const isAdmin = !currentUser || ["admin", "manager", "leader", "director"].includes(role ?? "");

  const { auditLogs, handleExportAuditLogsCSV, loadAuditLogs, loadingAuditLogs, setAuditAgentFilter, auditAgentFilter } = useAutonomyAuditLogs({ bandId, activeTab });

  const { setResponseStrategies, setLearnedResponseRules, setStartupChecklist, startupChecklist, learnedResponseRules, getStrategyOrDefault, updateStrategyField, strategiesFeedback, handleSaveResponseStrategies, isSavingStrategies } = useResponseStrategies({ isAdmin });

  const { emailAccountConnected, setConfig, config, applyPresetRecommendedBooking, applyPresetCommercial, applyPresetAllDay, timezone, setTimezone, diasEnviador, horasEnviador, setDiasEnviador, toggleDiaEnviador, setHorasEnviador, toggleHoraEnviador, handleSave, isSaving, isLoading, savedSuccess } = useAutonomyConfig({ initialConfig, bandName, bandId, currentUser, isOpen, setResponseStrategies, setLearnedResponseRules, setStartupChecklist, isAdmin, onSaveConfig, onClose });

  return { isAdmin, setActiveTab, activeTab, emailAccountConnected, auditLogs, startupChecklist, setConfig, config, applyPresetRecommendedBooking, applyPresetCommercial, applyPresetAllDay, timezone, setTimezone, diasEnviador, horasEnviador, setDiasEnviador, toggleDiaEnviador, setHorasEnviador, toggleHoraEnviador, learnedResponseRules, getStrategyOrDefault, updateStrategyField, strategiesFeedback, handleSaveResponseStrategies, isSavingStrategies, handleExportAuditLogsCSV, loadAuditLogs, loadingAuditLogs, setAuditAgentFilter, auditAgentFilter, handleSave, isSaving, isLoading, savedSuccess };
}
