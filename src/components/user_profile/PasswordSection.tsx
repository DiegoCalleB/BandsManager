/**
 * Cambio de contraseña con confirmación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Key } from "lucide-react";
import { Input } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Cambio de contraseña con confirmación.
 * @returns Sección de interfaz.
 */
export function PasswordSection() {
  const { newPassword, setNewPassword, confirmPassword, setConfirmPassword } = useUserProfile();
  return (
    <>
      <div className="pt-2 bg-[var(--surface)]/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[var(--acc)]">
          <Key className="w-4 h-4" />
          <span>Cambiar contraseña</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-sans text-[var(--ink-2)]">
            Nueva contraseña secreta
          </label>
          <Input
            size="sm"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Dejar en blanco para mantener la actual…"
            className="w-full"
          />
        </div>

        {newPassword.length > 0 && (
          <div className="space-y-1 animate-in fade-in duration-200">
            <label className="text-xs font-sans text-[var(--ink-2)]">
              Confirmar nueva contraseña
            </label>
            <Input
              size="sm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña…"
              className="w-full"
            />
          </div>
        )}
      </div>
    </>
  );
}
