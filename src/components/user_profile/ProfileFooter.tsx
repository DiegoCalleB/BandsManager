/**
 * Pie del perfil: cancelar y guardar cambios.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Shield } from "lucide-react";
import { Button } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Pie del perfil: cancelar y guardar cambios.
 * @returns Sección de interfaz.
 */
export function ProfileFooter() {
  const { isAdmin, currentUser, onOpenBandManagement, onClose } = useUserProfile();
  return (
    <>
      <div
        className={`px-6 py-3 flex justify-between items-center ${" bg-[var(--bg)]"}`}
      >
        {(isAdmin ||
          currentUser.role === "leader" ||
          currentUser.role === "admin") &&
        onOpenBandManagement ? (
          <button
            onClick={() => {
              onClose();
              onOpenBandManagement();
            }}
            className="text-xs font-sans text-[var(--ok)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Shield className="w-3 h-3" />
            <span>Gestión de la banda</span>
          </button>
        ) : (
          <span className="text-micro font-sans text-[var(--ink-2)]">
            BandManager.io v2.0
          </span>
        )}

        <Button
          variant="ghost"
          size="xs"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
    </>
  );
}
