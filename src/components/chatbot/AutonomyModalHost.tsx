/**
 * Modal de niveles de autonomía, solo para administradores.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AgentAutonomySettingsModal } from "../dashboard/AgentAutonomySettingsModal";
import { useChat } from "./ChatContext";

/**
 * Modal de niveles de autonomía, solo para administradores.
 * @returns Sección de interfaz.
 */
export function AutonomyModalHost() {
  const { isAdmin, isAutonomyModalOpen, setIsAutonomyModalOpen, bandDisplayName } = useChat();
  return (
    <>
      {/* MODAL CONFIGURACIÓN NIVELES DE AUTONOMÍA (SOLO ADMINISTRADORES) */}
      {isAdmin && (
      <AgentAutonomySettingsModal isOpen={isAutonomyModalOpen} onClose={() => setIsAutonomyModalOpen(false)} bandName={bandDisplayName} />
      )}
    </>
  );
}
