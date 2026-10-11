/**
 * Selector del idioma de la plataforma.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check,Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import { useUserProfile } from "./UserProfileContext";

/**
 * Selector del idioma de la plataforma.
 * @returns Sección de interfaz.
 */
export function LanguageSelector() {
  const { language, setLanguage } = useUserProfile();
  return (
    <>
      <div className="space-y-2 pt-2 ">
        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Idioma de la plataforma / language</span>
          </span>
          <span className="text-micro text-[var(--acc)]/80 font-normal font-sans">
            Multilenguaje
          </span>
        </label>
        <div className="pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`p-2.5 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-2 active:scale-[0.97] ${
                    isSelected
                      ? "bg-[var(--acc)]/20  text-[var(--ink)] font-bold"
                      : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">
                      {lang.flag}
                    </span>
                    <span className="text-xs truncate">{lang.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
