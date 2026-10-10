/**
 * Pestaña de público y resumen post-show.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Edit,Music } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useEventDetail } from "./EventDetailContext";

/**
 * Pestaña de público y resumen post-show.
 * @returns Sección de interfaz.
 */
export function PostShowTab() {
  const { modalActiveTab, textTitle, selectedConcert, setShowEventFichaModal, setViewingConcert, textSub } = useEventDetail();
  return (
    <>
{/* TAB 4: PÚBLICO & RESUMEN POST-SHOW */}
            {modalActiveTab === 'postshow' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                      Sección 4
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
                      Convocatoria Real, Bandas del Cartel y Sensaciones Post-Show
                    </h3>
                  </div>
                  {selectedConcert && (
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      onClick={() => {
                        setShowEventFichaModal(false);
                        setViewingConcert(selectedConcert);
                      }}
                      className="items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar convocatoria / dictar nota</span>
                    </Button>
                  )}
                </div>

                <p className={`text-xs font-sans leading-relaxed ${textSub}`}>
                  Registra la asistencia propia real y las impresiones tras el directo. Esta información alimenta directamente la
                  inteligencia del <strong className="text-[var(--acc)]">Agente de IA Booking</strong> para usarse como prueba social
                  irrefutable y objetiva al negociar con nuevas salas y festivales.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-[var(--r-m)] ${'bg-[var(--acc-soft)]/60'}`}
                  >
                    <div className="text-micro font-mono text-[var(--acc)] font-bold mb-1">
                      <ShowIcon inline emoji="👥" />Asistencia propia estimada
                    </div>
                    <div className="text-2xl font-black font-mono text-[var(--acc)]">
                      {selectedConcert?.asistencia_propia ?? selectedConcert?.aforo_vendido ?? 0}{' '}
                      <span className="text-xs font-normal text-[var(--ink-2)]">espectadores</span>
                    </div>
                    <p className="text-micro font-mono text-[var(--ink-2)] mt-1">Público que acudió específicamente a ver a la banda.</p>
                  </div>

                  <div
                    className={`p-3.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
                  >
                    <div className="text-micro font-mono text-[var(--ink-2)] font-bold mb-1">
                      <ShowIcon inline emoji="🎸" />Público de otros grupos
                    </div>
                    <div className="text-2xl font-black font-mono text-[var(--ink)]">
                      {selectedConcert?.asistencia_otras_bandas ?? 0}{' '}
                      <span className="text-xs font-normal text-[var(--ink-2)]">espectadores</span>
                    </div>
                    <p className="text-micro font-mono text-[var(--ink-2)] mt-1">Afluencia aportada por el resto del cartel.</p>
                  </div>

                  <div
                    className={`p-3.5 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}
                  >
                    <div className="text-micro font-mono text-[var(--ink-2)] font-bold mb-1"><ShowIcon inline emoji="⭐" />Hito de Booking</div>
                    <div className="text-sm font-bold font-mono mt-1">
                      {selectedConcert?.es_hito_destacado ? (
                        <span className="px-2 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ink)] inline-flex items-center gap-1">
                          <ShowIcon inline emoji="⭐" />HITO DESTACADO DE LA BANDA
                        </span>
                      ) : (
                        <span className="text-[var(--ink-2)] font-normal text-xs">Estándar (marcar si fue un lleno/éxito clave)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--sunken)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Bandas y cartel compartido</span>
                  </h4>
                  <p className={`text-xs font-mono ${textTitle}`}>
                    {Array.isArray(selectedConcert?.bandas_compartidas) && selectedConcert.bandas_compartidas.length > 0
                      ? selectedConcert.bandas_compartidas.join(', ')
                      : selectedConcert?.bandas_compartidas || 'Concierto individual en solitario'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--acc-soft)]/40'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <span>Resumen / sensaciones post-Show (usado por la IA)</span>
                  </h4>
                  {selectedConcert?.post_show_review ? (
                    <p className={`text-xs font-sans italic leading-relaxed ${textTitle}`}>
                      &ldquo;{selectedConcert.post_show_review}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-[var(--ink-2)] italic">
                      Sin nota de voz ni resumen escrito registrado todavía. Pulsa &quot;Editar Convocatoria&quot; arriba para añadir la
                      nota de voz desde el camerino o furgoneta.
                    </p>
                  )}
                </div>
              </div>
            )}
    </>
  );
}
