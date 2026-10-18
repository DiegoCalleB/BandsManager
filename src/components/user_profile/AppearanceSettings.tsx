/**
 * Ajustes de apariencia: tema y tipografía.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,ChevronDown,Palette,Type } from "lucide-react";
import { ThemeName } from "../../types";
import { THEMES } from "../../utils/theme";
import { FONT_PRESETS } from "../../utils/typography";
import { useUserProfile } from "./UserProfileContext";

/**
 * Ajustes de apariencia: tema y tipografía.
 * @returns Sección de interfaz.
 */
export function AppearanceSettings() {
  const { onThemeChange, onFontChange, setShowAppearance, showAppearance, currentTheme, currentFont } = useUserProfile();
  return (
    <>
      {/* Collapsible Appearance Settings (Theme & Font) */}
      {(onThemeChange || onFontChange) && (
        <div className="pt-3 ">
          <button
            type="button"
            onClick={() => setShowAppearance(!showAppearance)}
            className={`w-full p-2.5 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-2 ${"bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-xs font-sans font-semibold">
                Personalización visual (Tema y fuente)
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-sans text-[var(--ink-2)]">
              <span>{showAppearance ? "Ocultar" : "Configurar"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showAppearance ? "rotate-180 text-[var(--acc)]" : ""}`}
              />
            </div>
          </button>

          {showAppearance && (
            <div className="mt-3 p-3.5 rounded-[var(--r-m)] space-y-4 bg-[var(--surface)]/50 animate-in fade-in duration-200">
              {onThemeChange && (
                <div className="space-y-2">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>Tema visual de la aplicación</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(THEMES).map(([key, t]) => {
                      const isSelected = currentTheme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onThemeChange(key as ThemeName)}
                          className={`p-2 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? "bg-[var(--acc)]/15  text-[var(--ink)] font-bold"
                              : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                          }`}
                        >
                          <span className="text-xs font-sans truncate">
                            {t.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {onFontChange && (
                <div className="space-y-2 pt-2 ">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span>Estilo de fuente y tipografía</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FONT_PRESETS.map((p) => {
                      const isSelected = currentFont === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onFontChange(p.id)}
                          className={`p-2 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex flex-col gap-0.5 ${
                            isSelected
                              ? "bg-[var(--ok)]/15 text-[var(--ink)] font-bold"
                              : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span
                              className="text-xs font-bold truncate"
                              style={{ fontFamily: p.displayFont }}
                            >
                              {p.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sistema «Espectro» — el rediseño en curso, real y en vivo. Independiente del
 selector THEMES de arriba (ese es el sistema viejo, con colors/ThemeColors por
 prop — sigue vivo y no se toca). Este escribe directo en <html data-theme> via
 src/utils/temaEspectro.ts, asi que el cambio es instantaneo sin re-render del
 arbol: las 4.365 clases de color se resuelven solas via CSS vars. Por defecto'classic' = exactamente la app de siempre; el resto son las pantallas ya
 migradas (login, panel) mas el resto de la app tal cual, mientras avanza. */}
    </>
  );
}
