/**
 * Banner para músicos y bandas
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useFansLanding } from "./FansLandingContext";

/**
 * Banner para músicos y bandas
 * @returns Sección de interfaz.
 */
export function MusiciansBanner() {
  const { t } = useFansLanding();
  return (
    <>
{/* Banner para músicos y bandas al final del formulario */}
        <div className="pt-4 text-left">
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  space-y-2.5">
            <div className="flex items-center gap-2 text-[var(--acc)] text-xs font-sans font-bold">
              <span>{t("musicianBannerTitle")}</span>
            </div>
            <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
              {t("musicianBannerSubtitle")}
            </p>
            <div className="pt-1">
              <a
                href="/musicos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--ink)] font-sans text-xs font-bold transition-ui "
              >
                {t("musicianBannerCTA")}
              </a>
            </div>
          </div>
        </div>
    </>
  );
}
