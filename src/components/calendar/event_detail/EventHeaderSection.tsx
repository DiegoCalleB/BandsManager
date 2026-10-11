/**
 * Cabecera de la ficha: identidad de banda, título y barra de acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bell,Copy,Megaphone,MoreHorizontal,Share2,Trash2 } from "lucide-react";
import { Button } from "../../ui";
import { PopoverAncla } from "../../ui/PopoverAncla";
import { ShowIcon } from "../../ui/ShowIcon";
import { CalendarWeatherBadge } from "../AnimatedWeatherIcon";
import { PromocionConciertoModal } from "../PromocionConciertoModal";
import { useEventDetail } from "./EventDetailContext";

/**
 * Cabecera de la ficha: identidad de banda, título y barra de acciones.
 * @returns Sección de interfaz.
 */
export function EventHeaderSection() {
  const { modalBandInfo, textTitle, selectedEventTitle, textSub, selectedDate, monthNames, modalWeatherAlerts, modalEvent, setShowEventFichaModal, selectedConcert, setViewingConcert, selectedRehearsal, setViewingRehearsal, handleShareEventWhatsApp, isConcert, setShowPromocion, setShowFichaMenu, showFichaMenu, handleNotifyBandMembers, handleCopyEventFicha, copiedEventModalId, setDeletingEventConfirmId, showPromocion } = useEventDetail();
  return (
    <>
{/* Cabecera: Logo HD + identidad de banda + título + barra de acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {modalBandInfo.logoUrl ? (
                  <img
                    src={modalBandInfo.logoUrl}
                    alt={modalBandInfo.name}
                    className="w-11 h-11 sm:w-16 sm:h-16 rounded-[var(--r-l)] object-contain bg-[var(--sunken)] p-1 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials-modal');
                      if (fb) (fb as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span
                  className={`fallback-initials-modal w-11 h-11 sm:w-16 sm:h-16 rounded-[var(--r-l)] shrink-0 flex items-center justify-center text-xl font-bold ${modalBandInfo.palette.badge} ${modalBandInfo.logoUrl ? 'hidden' : ''}`}
                >
                  {modalBandInfo.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] inline-flex items-center gap-1">
                    <ShowIcon inline emoji="🎸" />{modalBandInfo.name}
                  </span>
                  <h3 className={`text-lg sm:text-xl font-bold font-display mt-1 line-clamp-2 sm:truncate ${textTitle}`}>{selectedEventTitle}</h3>
                  <p className={`text-xs font-mono mt-0.5 ${textSub}`}>
                    {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                  </p>
                  {modalWeatherAlerts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {modalWeatherAlerts.map((alert) => (
                        <CalendarWeatherBadge key={alert.id} alert={alert} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Acciones del Evento (Editar, WhatsApp, Notificar, Copiar, Eliminar) */}
              {modalEvent && (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setShowEventFichaModal(false);
                      if (selectedConcert) setViewingConcert(selectedConcert);
                      if (selectedRehearsal) setViewingRehearsal(selectedRehearsal);
                    }}
                    className="items-center gap-1"
                    title="Editar todos los campos de este evento"
                  >
                    <ShowIcon inline emoji="✎" />Editar
                  </Button>

                  <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => handleShareEventWhatsApp(modalEvent, isConcert)}
                    className="items-center gap-1"
                    title="Compartir convocatoria por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">WhatsApp</span>
                  </Button>

                  {isConcert && (
                    <Button
                      variant="soft"
                      size="xs"
                      type="button"
                      onClick={() => setShowPromocion(true)}
                      className="items-center gap-1"
                      title="Cuenta atrás, textos y enlaces con clics para promocionar este concierto"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Promocionar</span>
                    </Button>
                  )}
                  </div>

                  {/* Móvil: lo secundario detrás de ⋯ (AGENTS.md §6) */}
                  <div className="relative">
                    <Button
                      variant="neutral"
                      size="sm"
                      type="button"
                      onClick={() => setShowFichaMenu((v) => !v)}
                      aria-label="Más acciones"
                      aria-expanded={showFichaMenu}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {showFichaMenu && (
                      <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setShowFichaMenu(false)} />
                        <PopoverAncla className="menu-pop absolute right-0 mt-1.5 w-52 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 z-[9999] border border-[var(--line)]">
                          {isConcert && (
                            <button type="button" className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowFichaMenu(false); setShowPromocion(true); }}>
                              <Megaphone className="w-4 h-4 text-[var(--ink-2)]" /> Promocionar
                            </button>
                          )}
                          <button type="button" className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowFichaMenu(false); handleShareEventWhatsApp(modalEvent, isConcert); }}>
                            <Share2 className="w-4 h-4 text-[var(--ink-2)]" /> Compartir por WhatsApp
                          </button>
                          <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowFichaMenu(false); handleNotifyBandMembers(modalEvent, isConcert); }}>
                            <Bell className="w-4 h-4 text-[var(--ink-2)]" /> Avisar a la banda
                          </button>
                          <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--ink)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowFichaMenu(false); handleCopyEventFicha(modalEvent, isConcert); }}>
                            <Copy className="w-4 h-4 text-[var(--ink-2)]" /> {copiedEventModalId === modalEvent.id ? 'Copiado' : 'Copiar convocatoria'}
                          </button>
                          <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-s)] text-sm text-[var(--alert)] hover:bg-[var(--sunken)] cursor-pointer" onClick={() => { setShowFichaMenu(false); setDeletingEventConfirmId(modalEvent.id); }}>
                            <Trash2 className="w-4 h-4" /> Eliminar evento
                          </button>
                        </PopoverAncla>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedConcert && (
              <PromocionConciertoModal isOpen={showPromocion} onClose={() => setShowPromocion(false)} concert={selectedConcert} />
            )}
    </>
  );
}
