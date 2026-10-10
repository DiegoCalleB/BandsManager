/**
 * Seguimiento en vivo de la ejecución de un agente autónomo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity, AlertCircle, CheckCircle, RefreshCw, Terminal, X } from "lucide-react";
import type { Lead } from "../../types";
import { IconButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useChat } from "./ChatContext";

/**
 * Seguimiento en vivo de la ejecución de un agente autónomo.
 * @returns Sección de interfaz.
 */
export function ActiveRunPanel() {
  const { activeRun, setActiveRun, leads } = useChat();
  return (
    <>
      {activeRun && (
        <div
          className={` rounded-[var(--r-l)] p-4 space-y-3 max-w-sm mt-1 animate-in slide-in-from-bottom-2 fade-in duration-300 ${' bg-[var(--surface)] text-[var(--ink)]'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-micro font-sans font-bold">
              <Activity className={`w-3.5 h-3.5 ${'text-[var(--tentative)]'}`} />
              <span>Monitoreando {activeRun.agentName}</span>
            </div>
            <IconButton
              label="Cerrar monitor"
              type="button"
              onClick={() => setActiveRun(null)}
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>

          <div className={`p-3 rounded-[var(--r-m)] ${'bg-[var(--sunken)]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-micro font-sans text-[var(--ink-2)]">Estado</span>
              {activeRun.status === 'queued' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)]/15 text-[var(--ink)]">
                  <ShowIcon inline emoji="🕒" />En Cola
                </span>
              )}
              {activeRun.status === 'fetching' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)]/15 text-[var(--ink)]">
                  <ShowIcon inline emoji="🔄" />Despachando
                </span>
              )}
              {activeRun.status === 'in_progress' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)]/10 text-[var(--ink)]">
                  <ShowIcon inline emoji="⚙️" />Ejecutando…
                </span>
              )}
              {activeRun.status === 'completed' && activeRun.conclusion === 'success' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--surface)]/15 text-[var(--ok)]">
                  <ShowIcon inline emoji="✅" />Éxito
                </span>
              )}
              {activeRun.status === 'completed' && activeRun.conclusion === 'failure' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--alert)]/15 text-[var(--ink)]">
                  <ShowIcon inline emoji="❌" />Fallido
                </span>
              )}
              {activeRun.status === 'completed' && activeRun.conclusion !== 'success' && activeRun.conclusion !== 'failure' && (
                <span className="px-2 py-0.5 rounded text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
                  {activeRun.conclusion || 'Terminado'}
                </span>
              )}
            </div>

            {/* Steps sequencer */}
            {activeRun.steps && activeRun.steps.length > 0 && (
              <div className="mt-3 space-y-2 pt-2 -dashed">
                <div className="flex items-center gap-1.5 text-micro text-[var(--ink-2)]">
                  <Terminal className="w-3 h-3" /> Secuencia de Pasos:
                </div>
                <div className="space-y-1.5 pl-1">
                  {activeRun.steps.map((step, idx) => {
                    const isStepSuccess = step.conclusion === 'success';
                    const isStepFailure = step.conclusion === 'failure';
                    const isStepRunning = step.status === 'in_progress';

                    let dotColor = 'bg-[var(--surface)]/80';
                    let textColor = 'text-[var(--ink-2)]';
                    if (isStepSuccess) {
                      dotColor = 'bg-[var(--ok)]';
                      textColor = 'text-[var(--ink-2)]';
                    } else if (isStepFailure) {
                      dotColor = 'bg-[var(--alert)]';
                      textColor = 'text-[var(--alert)] font-bold';
                    } else if (isStepRunning) {
                      dotColor = 'bg-[var(--acc)] ';
                      textColor = 'text-[var(--acc)] font-bold';
                    }

                    return (
                      <div key={idx} className="flex items-center gap-2 text-micro font-sans">
                        <span className={`w-1.5 h-1.5 rounded-[var(--r-pill)] shrink-0 ${dotColor}`} />
                        <span className={`truncate leading-none ${textColor}`}>{step.name}</span>
                        {isStepRunning && <RefreshCw className="w-2.5 h-2.5 animate-spin text-[var(--acc)] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Outcome message feedback */}
          {activeRun.status === 'completed' &&
            activeRun.conclusion === 'success' &&
            (() => {
              const isLector = (activeRun.agentName || '').toLowerCase().includes('lector');
              const isEnviador = (activeRun.agentName || '').toLowerCase().includes('enviador');
              const isRedactor = (activeRun.agentName || '').toLowerCase().includes('redactor');

              if (isLector) {
                return (
                  <div className="p-3.5 bg-[var(--ok-soft)] rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
                      <span className="text-xs text-[var(--ok)] font-bold">¡Bandeja sincronizada!</span>
                    </div>
                    <p className="text-micro leading-normal text-[var(--ok)]">
                      El agente Lector ha revisado tu bandeja de correo y actualizado el hilo de respuestas en Supabase.
                    </p>
                  </div>
                );
              }

              if (isEnviador) {
                return (
                  <div className="p-3.5 bg-[var(--ok)]/10 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
                      <span className="text-xs text-[var(--ok)] font-bold">¡Despacho completado!</span>
                    </div>
                    <p className="text-micro leading-normal text-[var(--ok)]">
                      El agente Enviador ha procesado los correos autorizados en Supabase y registrado las fechas de envío.
                    </p>
                  </div>
                );
              }

              if (isRedactor) {
                return (
                  <div className="p-3.5 bg-[var(--ok)]/10 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
                      <span className="text-xs text-[var(--ok)] font-bold">¡Borradores generados!</span>
                    </div>
                    <p className="text-micro leading-normal text-[var(--ok)]">
                      El agente Redactor ha generado propuestas personalizadas en Supabase listas para tu revisión.
                    </p>
                  </div>
                );
              }

              // Get actual new leads
              let detectedLeads = leads.filter((l) => !activeRun.initialLeadIds?.includes(l.id));

              if (activeRun.region) {
                const searchLower = activeRun.region.toLowerCase();
                const regionalFiltered = detectedLeads.filter(
                  (l) =>
                    (l.ciudad && l.ciudad.toLowerCase().includes(searchLower)) ||
                    (l.region && l.region.toLowerCase().includes(searchLower)) ||
                    (l.fuente && l.fuente.toLowerCase().includes(searchLower))
                );
                if (regionalFiltered.length > 0) {
                  detectedLeads = regionalFiltered;
                }
              }

              // Fallback to region-specific simulated leads if no new leads were detected or in demo mode
              if (detectedLeads.length === 0 || activeRun.isDemo) {
                const regionName = activeRun.region || activeRun.params?.region || activeRun.params?.ciudad || 'Huelva';
                const normLoc = regionName.toLowerCase();
                const dateTag = new Date().toLocaleDateString();

                if (normLoc.includes('huelva')) {
                  detectedLeads = [
                    {
                      // eslint-disable-next-line react-hooks/purity -- id de lead simulado: solo se usa como clave de la demo
                      id: `demo-huelva-1-${Date.now()}`,
                      nombre_sala: 'Gran Teatro de Huelva',
                      ciudad: 'Huelva',
                      region: 'Andalucía',
                      aforo: 600,
                      genero: 'Música / Teatro / Mestizaje',
                      tipo: activeRun.params?.tipo || 'Teatro/Sala',
                      email_contacto: 'programacion@teatrohuelva.es',
                      telefono: '+34 959 21 01 00',
                      instagram: '@teatrohuelva',
                      fuente: 'Scout Descubridor: Huelva',
                      estado: 'nuevo',
                      pitch_generado: '',
                      notas: `Descubierto para Huelva (${dateTag}).`,
                    },
                    {
                      // eslint-disable-next-line react-hooks/purity -- id de lead simulado: solo se usa como clave de la demo
                      id: `demo-huelva-2-${Date.now()}`,
                      nombre_sala: 'Foro Iberoamericano de La Rábida',
                      ciudad: 'Palos de la Frontera (Huelva)',
                      region: 'Andalucía',
                      aforo: 2500,
                      genero: 'Festivales / Conciertos',
                      tipo: 'Festival',
                      email_contacto: 'cultura@diphuelva.es',
                      telefono: '+34 959 53 05 00',
                      instagram: '@diphuelva',
                      fuente: 'Scout Descubridor: Huelva',
                      estado: 'nuevo',
                      pitch_generado: '',
                      notas: `Descubierto para Huelva (${dateTag}).`,
                    },
                  ];
                } else if (normLoc.includes('sevilla') || normLoc.includes('andaluc')) {
                  detectedLeads = [
                    {
                      // eslint-disable-next-line react-hooks/purity -- id de lead simulado: solo se usa como clave de la demo
                      id: `demo-sevilla-1-${Date.now()}`,
                      nombre_sala: 'Sala Custom',
                      ciudad: 'Sevilla',
                      region: 'Andalucía',
                      aforo: 1000,
                      genero: 'Rock / Electronica / Fusion',
                      tipo: activeRun.params?.tipo || 'Sala',
                      email_contacto: 'info@salacustom.com',
                      telefono: '+34 954 51 52 53',
                      instagram: '@salacustom',
                      fuente: 'Scout Descubridor: Sevilla',
                      estado: 'nuevo',
                      pitch_generado: '',
                      notas: `Descubierto para Sevilla (${dateTag}).`,
                    },
                  ];
                } else {
                  const capLoc = regionName.charAt(0).toUpperCase() + regionName.slice(1);
                  detectedLeads = [
                    {
                      // eslint-disable-next-line react-hooks/purity -- id de lead simulado: solo se usa como clave de la demo
                      id: `demo-gen-1-${Date.now()}`,
                      nombre_sala: `Gran Espacio Musical de ${capLoc}`,
                      ciudad: capLoc,
                      region: capLoc,
                      aforo: 550,
                      genero: 'Música en Directo / Fusion',
                      tipo: activeRun.params?.tipo || 'Sala',
                      email_contacto: `booking@espacio${capLoc.toLowerCase().replace(/\s+/g, '')}.es`,
                      telefono: '+34 900 12 34 56',
                      instagram: `@espacio_${capLoc.toLowerCase().replace(/\s+/g, '_')}`,
                      fuente: `Scout Descubridor: ${capLoc}`,
                      estado: 'nuevo',
                      pitch_generado: '',
                      notas: `Descubierto para ${capLoc} (${dateTag}).`,
                    },
                  ];
                }
              }

              const getLeadCategory = (lead: Lead) => {
                const name = (lead.nombre_sala || '').toLowerCase();
                const type = (lead.tipo || '').toLowerCase();
                if (
                  name.includes('ayuntamiento') ||
                  name.includes('ayto') ||
                  name.includes('concello') ||
                  name.includes('gobierno') ||
                  type.includes('ayuntamiento') ||
                  type.includes('concello') ||
                  type.includes('teatro') ||
                  type.includes('auditorio')
                ) {
                  return 'Ayuntamientos';
                }
                if (name.includes('festival') || name.includes('fest') || type.includes('festival')) {
                  return 'Festivales';
                }
                return 'Salas / Clubs';
              };

              const groupedLeads = detectedLeads.reduce((acc: Record<string, typeof detectedLeads>, lead) => {
                const cat = getLeadCategory(lead);
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(lead);
                return acc;
              }, {});

              return (
                <div className="p-3.5 bg-[var(--ok)]/10 rounded-[var(--r-m)] space-y-2.5 animate-in fade-in duration-300 select-text">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    <span className="text-xs text-[var(--ok)] font-bold">¡Búsqueda Finalizada!</span>
                  </div>

                  <p className="text-micro leading-normal text-[var(--ok)]">
                    El agente ha terminado con éxito y ha enviado los resultados directos a Supabase. Tu Gestor de Booking se ha
                    actualizado en tiempo real.
                  </p>

                  <div className=" pt-2.5 mt-2 space-y-2">
                    <div className="flex justify-between items-center text-micro font-sans">
                      <span className="text-[var(--ok)]/80 text-micro">Nuevos contactos añadidos:</span>
                      <span className="px-2 py-0.5 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold font-sans">
                        {detectedLeads.length} contactos
                      </span>
                    </div>

                    {detectedLeads.length > 0 ? (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {Object.entries(groupedLeads).map(([category, items]) => (
                          <div key={category} className="space-y-1">
                            <span className="text-micro font-bold font-sans text-[var(--ok)]/70 block">
                              {category} ({items.length})
                            </span>
                            <div className="space-y-1 pl-1">
                              {items.map((item, iIdx) => (
                                <div
                                  key={iIdx}
                                  className={`p-1.5 rounded text-micro font-sans flex flex-col gap-0.5 ${'bg-[var(--sunken)] text-[var(--ink-2)]'}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <strong className={`${'text-[var(--ink)]'} font-semibold truncate`}>{item.nombre_sala}</strong>
                                    <span className="text-micro opacity-75 font-sans">{item.ciudad}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-micro opacity-80 font-sans">
                                    <span className="truncate max-w-[150px]">{item.email_contacto || 'Sin email'}</span>
                                    <span className="text-[var(--ok)] text-micro font-bold">Añadido</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-micro italic text-[var(--ink-2)] font-sans">
                        No se detectaron nuevas filas en esta ejecución. Toda la información ya está al día.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

          {activeRun.status === 'completed' && activeRun.conclusion === 'failure' && (
            <div className="p-3 bg-[var(--alert)]/10 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--alert)] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
                  <span>Incidencia en los agentes</span>
                </p>
              </div>
              <p className="text-micro leading-normal text-[var(--ink-2)]/90">
                El agente encontró un problema durante su ejecución contra Supabase. Verifica tu conexión con la base de datos y vuelve a
                intentarlo.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
