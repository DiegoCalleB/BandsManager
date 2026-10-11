/**
 * Pestaña de redes: enlaces, próximos conciertos y dossier.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BookOpen,Calendar,ChevronDown,ChevronRight,ChevronUp,MapPin,Ticket } from "lucide-react";
import { renderBold } from "../../utils/richText";
import { safeUrl } from "../../utils/safeUrl";
import { SocialPlatformsList } from "../SocialPlatformsList";
import { LinkButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { DonationCard } from "./DonationCard";
import { useFansLanding } from "./FansLandingContext";

/**
 * Pestaña de redes: enlaces, próximos conciertos y dossier.
 * @returns Sección de interfaz.
 */
export function SocialLinksTab() {
  const { activeTab, t, socialLinks, language, trackClick, clickCounts, epkUrl, logoUrl, imgError, bandName, setImgError, miembros, upcomingConcerts, showAllConcerts, setShowAllConcerts, setActiveTab } = useFansLanding();
  return (
    <>
{/* Tab 1: Redes Sociales */}
        {activeTab === "redes" && (
          <div className="space-y-3.5 animate-fade-in pt-1">
            <div className="p-3.5 bg-[var(--surface)]/80 rounded-[var(--r-m)] text-center space-y-1">
              <p className="text-xs font-bold text-[var(--acc)]">
                {t("followHelpTitle")}
              </p>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
                {renderBold(t("followHelpBody"))}
              </p>
            </div>

            <SocialPlatformsList
              links={socialLinks || {}}
              variant="grid"
              showTitle={false}
              language={language}
              onPlatformClick={(plat, url) => trackClick(plat, url, "redes")}
              clickCounts={clickCounts}
              showClickCounts={true}
            />

            {/* Acceso a"Conócenos" / EPK / Dossier público con las caras de los miembros de la banda */}
            <a
              href={epkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("epk", epkUrl, "redes")}
              className="group relative flex items-center gap-3.5 p-4 rounded-[var(--r-l)] bg-[var(--sunken)]  transition-ui duration-300  text-left cursor-pointer overflow-hidden active:scale-[0.97]"
            >
              {logoUrl && !imgError && (
                <img
                  src={logoUrl}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 scale-110 transition-ui duration-300"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-[var(--surface)] "
                aria-hidden="true"
              />
              <div className="relative w-11 h-11 rounded-[var(--r-m)] bg-[var(--acc)]/25  text-[var(--ink)] flex items-center justify-center shrink-0 transition-transform overflow-hidden">
                {logoUrl && !imgError ? (
                  <img
                    src={logoUrl}
                    alt={bandName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <span className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition block truncate tracking-tight">
                  {t("epkCardTitle") || `Conócenos · ${bandName || "La Banda"}`}
                </span>
                <span className="text-xs text-[var(--ink-2)] font-sans block truncate mt-0.5">
                  {t("epkCardSubtitle") ||
                    "Historia, miembros, fotos y dossier"}
                </span>
              </div>

              {/* Caras / Avatares de los miembros de la banda */}
              {miembros && miembros.length > 0 && (
                <div className="relative hidden sm:flex items-center -space-x-2 shrink-0 pr-1">
                  {miembros.slice(0, 3).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="w-7 h-7 rounded-[var(--r-pill)] bg-[var(--surface)]/80 flex items-center justify-center text-micro font-bold text-[var(--acc-ink)] overflow-hidden"
                      title={`${m.nombre}${m.rol ? ` (${m.rol})` : ""}`}
                    >
                      {m.fotoUrl ? (
                        <img
                          src={m.fotoUrl}
                          alt={m.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {(m.nombre || "M").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {miembros.length > 3 && (
                    <div className="w-7 h-7 rounded-[var(--r-pill)] bg-[var(--surface)]/80 flex items-center justify-center text-micro font-bold text-[var(--ink-2)]">
                      +{miembros.length - 3}
                    </div>
                  )}
                </div>
              )}

              <ChevronRight className="relative w-5 h-5 text-[var(--ink-2)] group-hover:text-[var(--acc)] group-hover:translate-x-1 transition-ui shrink-0" />
            </a>

            {/* Aportación Económica / Revolut debajo de links de redes */}
            <DonationCard contextType="redes" />

            {/* PRÓXIMOS CONCIERTOS / GIRA - debajo de Colaborar y encima de Booking y Contratación */}
            {upcomingConcerts && upcomingConcerts.length > 0 && (
              <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--sunken)] space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {t("upcomingShowsTitle") || "Próximos Conciertos"}
                  </span>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] font-bold">
                    {upcomingConcerts.length}{" "}
                    {upcomingConcerts.length === 1 ? "fecha" : "fechas"}
                  </span>
                </div>
                <div
                  className={`space-y-1.5 ${showAllConcerts ? "max-h-64 overflow-y-auto pr-0.5" : ""}`}
                >
                  {(showAllConcerts
                    ? upcomingConcerts
                    : upcomingConcerts.slice(0, 3)
                  ).map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-[var(--ink)] truncate">
                            {c.sala}
                          </p>
                          <p className="text-xs text-[var(--ink-2)] truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--acc)]/80 shrink-0" />{" "}
                            {c.ciudad}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] text-micro font-bold shrink-0 font-sans">
                          {c.fecha}
                        </span>
                      </div>
                      {(c.entradasUrl || c.entradasLugarFisico) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {safeUrl(c.entradasUrl) && (
                            <a
                              href={safeUrl(c.entradasUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--r-s)] bg-[var(--ok)] text-[var(--on-ok)] text-micro font-bold hover:bg-[var(--ok)] transition-colors"
                            >
                              <Ticket className="w-3 h-3" /> Comprar entradas
                            </a>
                          )}
                          {c.entradasLugarFisico && (
                            <span className="text-micro text-[var(--ink-2)] truncate">
                              <ShowIcon inline emoji="📍" />También en: {c.entradasLugarFisico}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {upcomingConcerts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConcerts((v) => !v)}
                    className="w-full flex items-center justify-center gap-1 text-xs font-sans font-bold text-[var(--acc)]/90 hover:text-[var(--acc)]/70 transition-colors pt-0.5"
                  >
                    {showAllConcerts ? (
                      <>
                        Ver menos <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Ver todas ({upcomingConcerts.length}){" "}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="pt-1 text-center">
              <LinkButton
                type="button"
                onClick={() => setActiveTab("form")}
              >
                {t("followCTA")}
              </LinkButton>
            </div>
          </div>
        )}
    </>
  );
}
