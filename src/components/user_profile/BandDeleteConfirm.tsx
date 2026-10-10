/**
 * Confirmación de borrado de una banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle,Loader2,Trash2 } from "lucide-react";
import { Button } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Confirmación de borrado de una banda.
 * @returns Sección de interfaz.
 */
export function BandDeleteConfirm() {
  const { bandToDeleteInProfile, setBandToDeleteInProfile, handleConfirmDeleteBandInProfile, deletingBandId } = useUserProfile();
  return (
    <>
      {bandToDeleteInProfile && (
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/10 space-y-2 animate-in fade-in duration-200">
          <p className="text-xs font-bold text-[var(--alert)] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
            <span>
              ¿Eliminar proyecto "{bandToDeleteInProfile.name}"?
            </span>
          </p>
          <p className="text-xs text-[var(--ink-2)]">
            Se desvinculará este proyecto de tu cuenta de usuario. Esta
            acción no se puede deshacer.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setBandToDeleteInProfile(null)}
              className="px-2.5 py-1 rounded-[var(--r-s)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              variant="danger"
              size="xs"
              type="button"
              onClick={handleConfirmDeleteBandInProfile}
              disabled={!!deletingBandId}
              className="items-center gap-1.5"
            >
              {deletingBandId ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Eliminando…</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  <span>Sí, Eliminar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
