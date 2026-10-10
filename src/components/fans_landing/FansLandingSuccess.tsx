/**
 * Pantalla de éxito tras unirse a la comunidad: gracias, beneficios y accesos.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import {
Briefcase,
Check,
Download,
ExternalLink,
Heart,
Mail,
MessageCircle,
PartyPopper,
Phone,
Share2,
Sparkles,
Tag
} from "lucide-react";
import { renderBold } from "../../utils/richText";
import { safeUrl } from "../../utils/safeUrl";
import {
SocialPlatformsList
} from "../SocialPlatformsList";

import {
getWhatsAppUrl,
openWhatsAppChat,
WHATSAPP_WINDOW_NAME,
} from "../../utils/whatsapp";
import { Button,LinkButton } from '../ui';


import { DonationCard } from "./DonationCard";
import { FanFormLanguageSwitcher } from "./FanFormLanguageSwitcher";
import { useFansLanding } from "./FansLandingContext";

/**
 * Pantalla de éxito tras unirse a la comunidad: gracias, beneficios y accesos.
 * @returns Pantalla completa de la landing.
 */
export function FansLandingSuccess() {
  const { language, t, bandName, clickCounts, trackClick, successData, setSuccessData, setFormData, isConcertLink, setLanguage, availableLanguages, handleShareWithFriend, copiedShareLink, socialLinks, epkUrl, contactoBooking, isPreview } = useFansLanding();
  const incentivo = successData.incentivo || {};
  // Solo hay bloque de beneficios si la banda ha rellenado de verdad la descarga o el cupón
  // en el apartado QR; una cadena vacía o con espacios no cuenta como incentivo configurado.
  const enlaceDescargaFan = safeUrl(
    typeof incentivo.enlaceDescarga === "string"
      ? incentivo.enlaceDescarga.trim()
      : "",
  );
  const codigoDescuentoFan =
    typeof incentivo.codigoDescuento === "string"
      ? incentivo.codigoDescuento.trim()
      : "";
  const tieneBeneficios = Boolean(enlaceDescargaFan || codigoDescuentoFan);

  return (
    <div
      className={`${isPreview ? "min-h-full p-2 sm:p-4" : "min-h-screen p-4 pt-8 sm:items-center sm:pt-4"} bg-[var(--bg)] flex items-start justify-center`}
    >
      <div
        className={`max-w-md w-full bg-[var(--surface)] rounded-[var(--r-l)] ${isPreview ? "p-4 sm:p-6" : "p-6 sm:p-8"} text-center space-y-5 relative overflow-hidden`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-[var(--acc)] " />

        {isPreview && (
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs font-sans flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              {t("interactiveSimulation")}
            </span>
            <LinkButton
              type="button"
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  nombre: "",
                  email: "",
                  ciudad: "",
                  comoConocio: isConcertLink ? "Concierto" : "",
                  cancionFavorita: "",
                  mensaje: "",
                  instagram: "",
                  consentimiento: false,
                });
              }}
            >
              {t("backToForm")}
            </LinkButton>
          </div>
        )}

        <div className="w-20 h-20 bg-[var(--acc)]/10 rounded-[var(--r-pill)] flex items-center justify-center mx-auto mb-2">
          <Heart className="w-10 h-10 text-[var(--acc)]" />
        </div>

        <FanFormLanguageSwitcher
          language={language}
          onChange={setLanguage}
          languages={availableLanguages}
        />

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[var(--ink)] font-display flex items-center justify-center gap-2">
            <PartyPopper className="w-6 h-6 text-[var(--acc)]" />
            {t("welcomeTitle", { bandName })}
          </h2>
          <p className="text-[var(--ink-2)] font-sans text-sm leading-relaxed max-w-xs mx-auto">
            {successData.alreadyRegistered
              ? successData.message
              : (incentivo.mensajeAgradecimiento && language === "es") ||
                  !t("registeredDefaultMessage", { bandName })
                ? incentivo.mensajeAgradecimiento ||
                  t("registeredDefaultMessage", { bandName })
                : t("registeredDefaultMessage", { bandName })}
          </p>
        </div>

        {tieneBeneficios && (
          <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-6 mt-6 space-y-4">
            <h3 className="text-[var(--acc)] font-bold text-xs font-sans">
              {t("benefitsTitle")}
            </h3>

            {enlaceDescargaFan && (
              <div className="pt-2">
                <a
                  href={enlaceDescargaFan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 w-full p-3 bg-[var(--surface)] hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] text-[var(--ink)] font-sans text-xs transition-colors"
                >
                  <Download className="w-5 h-5 text-[var(--acc)]" />
                  <span className="font-bold">{t("downloadExclusive")}</span>
                </a>
              </div>
            )}

            {codigoDescuentoFan && (
              <div className="pt-2">
                <p className="text-micro text-[var(--ink-2)] font-bold mb-1">
                  {t("merchCode")}
                </p>
                <div className="flex items-center justify-center gap-2 p-3 bg-[var(--surface)] rounded-[var(--r-s)]">
                  <Tag className="w-4 h-4 text-[var(--ok)]" />
                  <span className="font-sans text-[var(--ok)] font-bold">
                    {codigoDescuentoFan}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARTIR CON UN AMIGO */}
        <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />{" "}
              {t("shareWithFriend") || "Pásaselo a un colega"}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
            {t("shareCardPrompt") ||
              "¿Conoces a alguien a quien le mole la buena música? Comparte este enlace directo para que también disfrute de los temas exclusivos."}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="primary"
              type="button"
              onClick={handleShareWithFriend}
              className="items-center justify-center gap-1.5"
            >
              {copiedShareLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--ink)]" />{" "}
                  {t("shareCopied") || "¡Copiado!"}
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[var(--ink)]" />{" "}
                  {t("shareWithFriend") || "Compartir"}
                </>
              )}
            </Button>
            <a
              href={getWhatsAppUrl(
                undefined,
                t("whatsappShareMessage", {
                  bandName,
                  url:
                    typeof window !== "undefined" ? window.location.href : "",
                }) ||
                  `¡Ey! Échale un ojo a ${bandName} y únete a su comunidad para conseguir temas inéditos y descuentos: ${typeof window !== "undefined" ? window.location.href : ""}`,
              )}
              target={WHATSAPP_WINDOW_NAME}
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                trackClick("whatsapp_share", "", "success");
                const msg =
                  t("whatsappShareMessage", {
                    bandName,
                    url:
                      typeof window !== "undefined"
                        ? window.location.href
                        : "",
                  }) ||
                  `¡Ey! Échale un ojo a ${bandName} y únete a su comunidad para conseguir temas inéditos y descuentos: ${typeof window !== "undefined" ? window.location.href : ""}`;
                openWhatsAppChat(undefined, msg);
              }}
              className="py-2.5 px-3 rounded-[var(--r-s)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.97] text-center"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Official Social Links in Success View */}
        {socialLinks && Object.values(socialLinks).some(Boolean) && (
          <div className="pt-2">
            <SocialPlatformsList
              links={socialLinks}
              variant="grid"
              title={t("followUsPlatforms")}
              language={language}
              onPlatformClick={(plat, url) =>
                trackClick(plat, url, "success")
              }
              clickCounts={clickCounts}
              showClickCounts={true}
            />
          </div>
        )}

        {/* Enlace discreto al EPK/Dossier, ahora que ya se han unido */}
        <div className="pt-1 text-center">
          <a
            href={epkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick("epk", epkUrl, "success")}
            className="text-xs font-sans text-[var(--acc)]/90 hover:text-[var(--acc)]/70 underline font-bold transition-colors inline-flex items-center gap-1"
          >
            {t("epkSuccessLink", { bandName })}{" "}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Revolut Support in Success View */}
        <DonationCard contextType="success" />

        {/* Booking / Contrataciones in Success View */}
        {contactoBooking &&
          (contactoBooking.email || contactoBooking.telefono) && (
            <div className="pt-4 text-left">
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--acc)] text-xs font-sans font-bold">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                    {t("bookingTitle")}
                  </div>
                  <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--ink)]">
                    {t("bookingBadgeLive")}
                  </span>
                </div>
                <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
                  {renderBold(t("bookingQuestion", { bandName }))}
                </p>
                <div className="space-y-1.5 pt-1">
                  {contactoBooking.email && (
                    <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
                      <a
                        href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t("bookingEmailSubject", { bandName }))}`}
                        className="flex items-center gap-2 text-xs font-sans text-[var(--acc)]/70 hover:text-[var(--ink)] truncate flex-1"
                      >
                        <Mail className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.email}
                        </span>
                      </a>
                    </div>
                  )}
                  {contactoBooking.telefono && (
                    <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
                      <a
                        href={`tel:${contactoBooking.telefono.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] truncate flex-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.telefono}
                        </span>
                      </a>
                      <a
                        href={getWhatsAppUrl(
                          contactoBooking.telefono,
                          t("bookingWhatsappText", { bandName }),
                        )}
                        target={WHATSAPP_WINDOW_NAME}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openWhatsAppChat(
                            contactoBooking.telefono,
                            t("bookingWhatsappText", { bandName }),
                          );
                        }}
                        className="px-2 py-0.5 text-micro font-sans text-[var(--ok)] bg-[var(--ok-soft)] rounded flex items-center gap-1 shrink-0 ml-2"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Banner para músicos y bandas */}
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

        {/* Enlace a Inicio */}
        <div className="pt-2">
          <a
            href="/"
            className="text-xs font-sans text-[var(--ink-2)] hover:text-[var(--acc)] underline transition-colors"
          >
            {t("backHome")}
          </a>
        </div>
      </div>
    </div>
  );
}
