/**
 * Logo, título y origen del concierto.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Flame } from "lucide-react";
import { sanitizeConcertDisplayName } from "../../utils/fanUtils";
import { renderBold } from "../../utils/richText";
import { FanFormLanguageSwitcher } from "./FanFormLanguageSwitcher";
import { useFansLanding } from "./FansLandingContext";

/**
 * Logo, título y origen del concierto.
 * @returns Sección de interfaz.
 */
export function FanIdentityHeader() {
  const { logoUrl, imgError, bandName, setImgError, t, isConcertLink, concertName, language, setLanguage, availableLanguages } = useFansLanding();
  return (
    <>
<div className="text-center space-y-4 pt-2">
          {logoUrl && !imgError ? (
            <div className="relative inline-block mx-auto">
              <img
                src={logoUrl}
                alt={bandName}
                onError={() => setImgError(true)}
                className="w-24 h-24 mx-auto object-contain p-1 rounded-[var(--r-l)]  bg-[var(--sunken)]"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-[var(--r-l)]  bg-[var(--sunken)]  flex flex-col items-center justify-center p-2">
              <Flame className="w-10 h-10 text-[var(--acc)] mb-0.5" />
              <span className="text-micro font-bold text-[var(--acc)]/70 font-display line-clamp-1">
                {bandName}
              </span>
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[var(--ink)] font-display">
              {t("joinTitle", { bandName })}
            </h1>
            <p className="text-[var(--acc)]/80 text-micro font-sans font-bold">
              {t("officialChannel")}
            </p>
          </div>
          <div className="pt-2 space-y-2">
            {isConcertLink ? (
              <div>
                <span className="text-[var(--ok)] font-bold px-3.5 py-1.5 bg-[var(--ok)]/10 rounded-[var(--r-pill)] inline-flex items-center gap-1.5 text-xs">
                  <span>
                    {concertName
                      ? t("thanksConcertWithName", {
                          concertName: sanitizeConcertDisplayName(concertName),
                        })
                      : t("thanksConcertGeneric")}
                  </span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[var(--on-acc)] font-bold px-3.5 py-1.5 bg-[var(--acc)] rounded-[var(--r-pill)] inline-flex items-center gap-1.5 text-xs">
                  <span>{t("thanksSupport")}</span>
                </span>
              </div>
            )}
            <p className="text-[var(--ink-2)] text-xs font-sans leading-relaxed max-w-sm mx-auto">
              {renderBold(t("supportIntro"))}
            </p>
            <FanFormLanguageSwitcher
              language={language}
              onChange={setLanguage}
              languages={availableLanguages}
            />
          </div>
        </div>
    </>
  );
}
