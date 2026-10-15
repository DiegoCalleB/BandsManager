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
  const { isAdmin, isAutonomyModalOpen, setIsAutonomyModalOpen, bandDisplayName, currentUser } = useChat();
  return (
    <>
      {/* MODAL CONFIGURACIÓN NIVELES DE AUTONOMÍA (SOLO ADMINISTRADORES) */}
      {isAdmin && (
      // Sin `bandId` ni `currentUser` el panel de Email se quedaba en «Comprobando cuenta…» para siempre:
      // no consultaba ninguna cuenta porque no sabía de qué banda.
      <AgentAutonomySettingsModal
        isOpen={isAutonomyModalOpen}
        onClose={() => setIsAutonomyModalOpen(false)}
        bandName={bandDisplayName}
        bandId={currentUser?.band_id || ""}
        currentUser={currentUser ?? undefined}
      />
      )}
    </>
  );
}
