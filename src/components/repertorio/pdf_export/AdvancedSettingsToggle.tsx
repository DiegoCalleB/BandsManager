/**
 * Botón que despliega los ajustes avanzados en móvil.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown, ChevronUp, Sliders } from "lucide-react";
import { usePdfExport } from "./PdfExportContext";

/**
 * Botón que despliega los ajustes avanzados en móvil.
 * @returns Sección de interfaz.
 */
export function AdvancedSettingsToggle() {
  const { setShowAdvancedSettings, showAdvancedSettings } = usePdfExport();
  return (
    <>
      <button
        onClick={() => setShowAdvancedSettings((v) => !v)}
        className={`sm:hidden w-full flex items-center justify-between px-3 py-2 rounded-[var(--r-s)] font-bold cursor-pointer transition-colors ${"bg-[var(--surface)] text-[var(--ink-2)]"}`}
      >
        <span className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Ajustes
          (letra, tinta, badges)
        </span>
        {showAdvancedSettings ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Row 2: Typography, Handwritten Sharpie Ink & Toggles — en móvil apilado en columna
 (3 grupos en una sola fila se apretaban demasiado en pantallas pequeñas), en
 desktop en fila con espacio de sobra. */}
    </>
  );
}
