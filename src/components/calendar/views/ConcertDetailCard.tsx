/**
 * Tarjeta detallada del concierto seleccionado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bell, Edit, MapPin, Maximize2, Phone, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import type { BandTaggedEvent } from "../calendarTypes";

/**
 * Tarjeta detallada del concierto seleccionado.
 * @returns Sección de interfaz.
 */
export function ConcertDetailCard() {
  const { selectedConcert, getBandIdentity, textTitle, setModalActiveTab, setShowEventFichaModal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, setShowReminderModal, setViewingConcert } = useCalendar();
  return (
    <>
      {/* Tarjeta detallada del concierto activo */}
      {selectedConcert &&
        (() => {
          const bandInfo = getBandIdentity(
            selectedConcert.band_id,
            (selectedConcert as BandTaggedEvent).bandName || (selectedConcert as BandTaggedEvent).band_name
          );
          return (
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] space-y-2.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                      <ShowIcon inline emoji="🎸" />Concierto
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
                      {bandInfo.name}
                    </span>
                    {selectedConcert.cache ? (
                      <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold text-[var(--ink)] bg-[var(--acc)]/10">
                        <ShowIcon inline emoji="💰" />{selectedConcert.cache.toLocaleString('es-ES')} €
                      </span>
                    ) : null}
                    <span
                      className={`px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold ${
                        selectedConcert.estado_pago === 'pagado'
                          ? 'bg-[var(--ok)]/20 text-[var(--ink)]'
                          : selectedConcert.estado_pago === 'anticipo'
                            ? 'bg-[var(--tentative)]/35 text-[var(--ink)]'
                            : 'bg-[var(--acc)]/20 text-[var(--ink)]'
                      }`}
                    >
                      {selectedConcert.estado_pago === 'pagado'
                        ? '✓ Cobrado'
                        : selectedConcert.estado_pago === 'anticipo'
                          ? 'Anticipo recibido'
                          : 'Pendiente cobro'}
                    </span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle} flex items-center gap-1.5 flex-wrap`}>
                    <span>{selectedConcert.sala}</span>
                    {selectedConcert.ciudad && (
                      <span className="text-[var(--acc)] font-normal text-sm sm:text-base">({selectedConcert.ciudad})</span>
                    )}
                  </h3>
                  {selectedConcert.direccion && (
                    <p className="text-micro font-sans text-[var(--ink-2)] mt-0.5"><ShowIcon inline emoji="📍" />{selectedConcert.direccion}</p>
                  )}
                </div>

                {/* Botones de acción: Accesos directos y Abrir Ficha */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setModalActiveTab('tecnica');
                      setShowEventFichaModal(true);
                    }}
                    className="px-2 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--ink-3)]/10 hover:bg-[var(--ink-3)]/15 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer transition-ui active:scale-[0.97]"
                    title="1. Logística técnica y rider"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>1. Técnica</span>
                  </button>
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setModalActiveTab('contactos');
                      setShowEventFichaModal(true);
                    }}
                    className="items-center gap-1"
                    title="2. Contactos clave y WhatsApp directo"
                  >
                    <Phone className="w-3 h-3" />
                    <span>2. Contactos</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalActiveTab('cierre');
                      setShowEventFichaModal(true);
                    }}
                    className="px-2 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]text-[var(--tentative)]/80 flex items-center gap-1 cursor-pointer transition-ui active:scale-[0.97]"
                    title="5. Checklist de cierre de material y carga de furgoneta"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>5. Cierre material</span>
                  </button>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setModalActiveTab('resumen');
                      setShowEventFichaModal(true);
                    }}
                    className="items-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Abrir ficha completa</span>
                  </Button>
                </div>
              </div>

              {/* Fila de metadatos adicionales */}
              <div className="flex items-center gap-3 text-micro font-sans text-[var(--ink)] flex-wrap pt-1 /20">
                {selectedConcert.aforo_total ? (
                  <span className="flex items-center gap-1">
                    <span><ShowIcon inline emoji="👥" /></span> Aforo: {selectedConcert.aforo_vendido || 0} / {selectedConcert.aforo_total}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <span><ShowIcon inline emoji="📄" /></span> {selectedConcert.contrato_firmado ? 'Contrato firmado' : 'Contrato pendiente'}
                </span>
                {selectedConcert.tipo && (
                  <span className="flex items-center gap-1 opacity-80">
                    <span><ShowIcon inline emoji="🏷️" /></span> Tipo: {selectedConcert.tipo}
                  </span>
                )}
              </div>

              {/* Botones secundarios */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setReminderNotes('');
                    setReminderSuccessMsg(null);
                    setReminderErrorMsg(null);
                    setShowReminderModal(true);
                  }}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
                >
                  <Bell className="w-3 h-3 text-[var(--ink-2)]" />
                  <span>Notificar banda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingConcert(selectedConcert)}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc-ink)] flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-[var(--acc)]" />
                  <span>Editar concierto</span>
                </button>
                {(selectedConcert.direccion || selectedConcert.sala) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[var(--ok)]" />
                    <span>Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          );
        })()}
    </>
  );
}
