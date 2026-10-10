/**
 * Acceso a los ajustes de notificaciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BellRing,ChevronDown } from "lucide-react";
import { useUserProfile } from "./UserProfileContext";

/**
 * Acceso a los ajustes de notificaciones.
 * @returns Sección de interfaz.
 */
export function NotificationSettingsCard() {
  const { onOpenNotificationSettings, onClose } = useUserProfile();
  return (
    <>
      {onOpenNotificationSettings && (
        <div className="pt-3 border-t border-[var(--hair)]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNotificationSettings();
            }}
            className={`w-full p-2.5 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-2 ${
              "bg-[var(--sunken)] text-[var(--ink-2)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-xs font-mono font-semibold">
                Notificaciones push del navegador
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1">
              <span>Configurar</span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
            </span>
          </button>
        </div>
      )}
    </>
  );
}
