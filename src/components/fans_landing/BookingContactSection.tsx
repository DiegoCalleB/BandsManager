/**
 * Contratación y booking directo
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Briefcase,Mail,MessageCircle,Phone } from "lucide-react";
import { renderBold } from "../../utils/richText";
import { getWhatsAppUrl,openWhatsAppChat,WHATSAPP_WINDOW_NAME } from "../../utils/whatsapp";
import { useFansLanding } from "./FansLandingContext";

/**
 * Contratación y booking directo
 * @returns Sección de interfaz.
 */
export function BookingContactSection() {
  const { contactoBooking, t, bandName } = useFansLanding();
  return (
    <>
{/* Sección Destacada de Contrataciones & Booking Directo */}
        {contactoBooking &&
          (contactoBooking.email || contactoBooking.telefono) && (
            <div className="pt-5 space-y-3">
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--acc)]">
                    <Briefcase className="w-4 h-4 text-[var(--acc)]" />
                    <span className="text-xs font-sans font-bold">
                      {t("bookingTitle")}
                    </span>
                  </div>
                  <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--ink)] font-bold">
                    {t("bookingBadgeLive")}
                  </span>
                </div>

                <p className="text-xs font-sans text-[var(--ink-2)] leading-relaxed">
                  {renderBold(t("bookingQuestion", { bandName }))}
                </p>

                <div className="space-y-2 pt-1">
                  {contactoBooking.email && (
                    <div className="flex items-center justify-between p-2.5 rounded-[var(--r-s)] bg-[var(--surface)]  transition-colors">
                      <a
                        href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t("bookingEmailSubject", { bandName }))}`}
                        className="flex items-center gap-2.5 text-xs font-sans text-[var(--acc)]/70 hover:text-[var(--ink)] transition-colors truncate flex-1 font-bold"
                      >
                        <Mail className="w-4 h-4 text-[var(--acc)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.email}
                        </span>
                      </a>
                    </div>
                  )}

                  {contactoBooking.telefono && (
                    <div className="flex items-center justify-between p-2.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--ok-soft)] transition-colors">
                      <a
                        href={`tel:${contactoBooking.telefono.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors truncate flex-1 font-bold"
                      >
                        <Phone className="w-4 h-4 text-[var(--ok)] shrink-0" />
                        <span className="truncate">
                          {contactoBooking.telefono}
                        </span>
                      </a>
                      <div className="flex items-center shrink-0 ml-2">
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
                          className="px-2.5 py-1 text-micro font-sans text-[var(--ok)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] rounded transition-colors flex items-center gap-1.5 font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[var(--ok)]" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
    </>
  );
}
