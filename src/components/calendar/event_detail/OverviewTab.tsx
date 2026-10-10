/**
 * Pestaña de resumen general y detalles del evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Clock,MapPin,Navigation,Phone,ShieldCheck,Shirt,Ticket,Users,Wrench } from "lucide-react";
import DirectionsCard from "../../DirectionsCard";
import { ShowIcon } from "../../ui/ShowIcon";
import { useEventDetail } from "./EventDetailContext";

/**
 * Pestaña de resumen general y detalles del evento.
 * @returns Sección de interfaz.
 */
export function OverviewTab() {
  const { modalActiveTab, textSub, selectedEventDetails, textTitle, isStitchLight, isPromoPlan, selectedConcert, selectedRehearsal, setModalActiveTab, modalRoadbook } = useEventDetail();
  return (
    <>
{/* TAB 1: RESUMEN GENERAL & DETALLES */}
            {modalActiveTab === 'resumen' && (
              <div className="space-y-4">
                <div
                  className={`space-y-3 rounded-[var(--r-m)] p-4 ${'bg-[var(--sunken)]'}`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className={`w-4 h-4 shrink-0 ${'text-[var(--acc)]'}`} />
                    <span className={`font-mono ${textSub}`}>Hora:</span>
                    <span className={`font-bold font-mono ${'text-[var(--acc)]'}`}>
                      {selectedEventDetails.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${'text-[var(--acc)]'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`font-mono ${textSub}`}>Lugar:</span>
                      <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
                      {selectedEventDetails.direccion && (
                        <p className={`text-xs font-sans mt-1 ${'text-[var(--ink-2)]'}`}>
                          <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedEventDetails.locationQuery && selectedEventDetails.type !== 'free' && (
                    <div className="pt-2 flex justify-center">
                      <DirectionsCard
                        query={selectedEventDetails.locationQuery}
                        locationName={selectedEventDetails.lugar}
                        address={selectedEventDetails.direccion}
                        isStitchLight={isStitchLight}
                      />
                    </div>
                  )}
                  {!isPromoPlan && selectedEventDetails.type === 'concert' && (
                    <div className="flex items-center gap-2 text-xs pt-2">
                      <span className={`font-mono ${textSub}`}>Compensación:</span>
                      <span className="text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
                    </div>
                  )}
                  {selectedEventDetails.type === 'concert' &&
                    (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
                      <div className="flex flex-col gap-1.5 pt-2">
                        {selectedEventDetails.entradasUrl && (
                          <a
                            href={selectedEventDetails.entradasUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold bg-[var(--ok)] text-[var(--on-ok)] hover:bg-[var(--ok)] transition-colors w-fit"
                          >
                            <Ticket className="w-3.5 h-3.5" /> Comprar entradas
                          </a>
                        )}
                        {selectedEventDetails.entradasLugarFisico && (
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-[var(--ok)] shrink-0" />
                            <span className={`font-mono ${textSub}`}>También en:</span>
                            <span className="font-semibold font-mono">{selectedEventDetails.entradasLugarFisico}</span>
                          </div>
                        )}
                      </div>
                    )}
                  {selectedConcert?.giraNombre && (
                    <div className="flex items-center gap-2 text-xs pt-2">
                      <Navigation className="w-4 h-4 text-[var(--acc)] shrink-0" />
                      <span className={`font-mono ${textSub}`}>Gira:</span>
                      <span className="font-bold font-mono text-[var(--acc)]"><ShowIcon inline emoji="🚐" />{selectedConcert.giraNombre}</span>
                    </div>
                  )}
                  {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
                    <div className="flex items-center gap-2 text-xs pt-2">
                      <Users className="w-4 h-4 text-[var(--acc)] shrink-0" />
                      <span className={`font-mono ${textSub}`}>Convocatoria:</span>
                      <span className="font-bold font-mono text-[var(--acc)]">
                        {(selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) === 'completa'
                          ? 'Banda Completa'
                          : `Parcial (${(() => {
                              const raw = (selectedConcert?.convocados_nombres || selectedRehearsal?.convocados_nombres) as string[] | string | undefined;
                              if (Array.isArray(raw)) return raw.join(', ') || 'Seleccionados';
                              if (typeof raw === 'string' && raw.trim()) return raw.trim();
                              return 'Seleccionados';
                            })()})`}
                      </span>
                    </div>
                  )}
                  {selectedEventDetails.notes && (
                    <div
                      className={`text-xs font-sans italic pt-2 leading-relaxed ${'text-[var(--ink-2)]'}`}
                    >
                      &ldquo;{selectedEventDetails.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Accesos rápidos a los 3 módulos clave en el resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setModalActiveTab('tecnica')}
                    className={`p-3 rounded-[var(--r-m)] transition-ui cursor-pointer hover:brightness-95 ${
                      'bg-[var(--acc-soft)]/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>1. Logística técnica</span>
                    </div>
                    <p className={`text-xs font-mono ${textSub}`}>
                      {modalRoadbook.horaPruebaSonido ? `Prueba: ${modalRoadbook.horaPruebaSonido}` : 'Configurar rider, P.A. y horarios'}
                    </p>
                    <span className="text-micro text-[var(--acc)] font-mono font-semibold underline mt-1 inline-block">
                      Abrir sección técnica →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('contactos')}
                    className={`p-3 rounded-[var(--r-m)] transition-ui cursor-pointer hover:brightness-95 ${
                      'bg-[var(--ok-soft)]/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[var(--ok)] font-mono font-bold text-xs mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>2. Contactos clave</span>
                    </div>
                    <p className={`text-xs font-mono ${textSub}`}>
                      {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0
                        ? `${modalRoadbook.contactosClave.length} contactos (WhatsApp directo)`
                        : 'Añadir contactos de sala y técnicos'}
                    </p>
                    <span className="text-micro text-[var(--ok)] font-mono font-semibold underline mt-1 inline-block">
                      Ver directorio →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('merchan')}
                    className={`p-3 rounded-[var(--r-m)] transition-ui cursor-pointer hover:brightness-95 ${
                      'bg-[var(--acc-soft)]/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
                      <Shirt className="w-3.5 h-3.5" />
                      <span>3. Control Merchandising</span>
                    </div>
                    <p className={`text-xs font-mono ${textSub}`}>
                      {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0
                        ? `${modalRoadbook.merchControl.items.length} productos | ${(modalRoadbook.merchControl.ingresosEfectivo || 0) + (modalRoadbook.merchControl.ingresosBizum || 0)}€ arqueo`
                        : 'Stock furgón vs final, Bizum y efectivo'}
                    </p>
                    <span className="text-micro text-[var(--acc)] font-mono font-semibold underline mt-1 inline-block">
                      Abrir control de ventas →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('cierre')}
                    className={`p-3 rounded-[var(--r-m)] transition-ui cursor-pointer hover:brightness-95 ${
                      'bg-[var(--acc-soft)]/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>5. Cierre material</span>
                    </div>
                    <p className={`text-xs font-mono ${textSub}`}>
                      {modalRoadbook.cierreMaterial
                        ? `${modalRoadbook.cierreMaterial.filter((i) => i.checked).length}/${modalRoadbook.cierreMaterial.length} verificados`
                        : 'Checklist de carga de furgoneta'}
                    </p>
                    <span className="text-micro text-[var(--acc)] font-mono font-semibold underline mt-1 inline-block">
                      Hacer checklist →
                    </span>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
