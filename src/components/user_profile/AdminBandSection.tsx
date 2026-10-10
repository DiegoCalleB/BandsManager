/**
 * Gestión de bandas para administradores dentro del perfil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Shield,Users } from "lucide-react";
import { useUserProfile } from "./UserProfileContext";

/**
 * Gestión de bandas para administradores dentro del perfil.
 * @returns Sección de interfaz.
 */
export function AdminBandSection() {
  const { isAdmin, currentUser, onOpenBandManagement, onClose } = useUserProfile();
  return (
    <>
      {/* Admin Band Management Section inside Profile */}
      {(isAdmin ||
        currentUser.role === "leader" ||
        currentUser.role === "admin") &&
        onOpenBandManagement && (
          <div className="pt-2 bg-[var(--surface)]/80 space-y-2">
            <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[var(--tentative)]" />
                <span>Administración de la banda</span>
              </span>
              <span className="text-micro text-[var(--tentative)] font-sans font-bold">
                Solo Admins
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBandManagement();
              }}
              className={`w-full p-3 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-2 ${"bg-[var(--tentative)]/5 hover:bg-[var(--acc)]/15 text-[var(--ink-2)]"}`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[var(--tentative)] shrink-0" />
                <div>
                  <div className="text-xs font-bold font-sans">
                    Gestión de la banda
                  </div>
                  <div className="text-micro opacity-75 font-sans">
                    Crear nuevos músicos, cambiar sus contraseñas y
                    permisos
                  </div>
                </div>
              </div>
              <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--ink)] ">
                Abrir &rarr;
              </span>
            </button>
          </div>
        )}
    </>
  );
}
