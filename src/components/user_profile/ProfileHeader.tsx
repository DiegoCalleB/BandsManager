/**
 * Cabecera del perfil: avatar, nombre y cierre.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { X } from "lucide-react";
import { textOnColor } from "../../utils/contrastText";
import { IconButton } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Cabecera del perfil: avatar, nombre y cierre.
 * @returns Sección de interfaz.
 */
export function ProfileHeader() {
  const { avatarColor, name, currentUser, isAdmin, currentPlanDef, onClose } = useUserProfile();
  return (
    <>
      <div
        className={`px-6 py-4 flex justify-between items-center ${" bg-[var(--bg)]"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--r-pill)] flex items-center justify-center font-bold text-[var(--ink)] font-sans text-sm shrink-0"
            style={{ backgroundColor: avatarColor, color: textOnColor(avatarColor) }}
          >
            {name.slice(0, 2) || "BK"}
          </div>
          <div>
            <h3 className="font-bold font-display text-sm flex items-center gap-2">
              <span>Mi perfil y contraseña</span>
            </h3>
            <p className="text-xs text-[var(--ink-2)] font-sans flex items-center gap-1.5 flex-wrap">
              <span>
                @{currentUser.username} •{" "}
                {isAdmin ? "Administrador" : "Músico"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-extrabold bg-[var(--acc)]/15 text-[var(--ink)]">
                {currentPlanDef.name}
              </span>
            </p>
          </div>
        </div>
        <IconButton
          label="Cerrar"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </div>
    </>
  );
}
