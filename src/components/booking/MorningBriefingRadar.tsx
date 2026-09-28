import React, { useState, useMemo } from 'react';
import { Lead, Concert, Tour } from '../../types';
import {
  findTourRoutingOpportunities,
  findCorridorForCity,
  areCitiesLogisticallyCompatible,
  SPANISH_TOUR_CORRIDORS,
} from '../../utils/tourRouting';
import {
  Sparkles,
  Flame,
  AlertCircle,
  Clock,
  Compass,
  MapPin,
  TrendingUp,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Printer,
  FileText,
  DollarSign,
  Fuel,
  Users,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

interface MorningBriefingRadarProps {
  leads: Lead[];
  concerts?: Concert[];
  tours?: Tour[];
  onSelectLead: (lead: Lead, options?: { tab?: 'info' | 'emails' | 'copilot' | 'bitacora'; pitchDraft?: string }) => void;
  onApproveLead?: (lead: Lead) => void;
  onOpenRoadbookModal?: (lead?: Lead) => void;
  isStitchLight?: boolean;
  bandName?: string;
}

export const MorningBriefingRadar: React.FC<MorningBriefingRadarProps> = ({
  leads,
  concerts = [],
  tours = [],
  onSelectLead,
  onApproveLead,
  onOpenRoadbookModal,
  isStitchLight = false,
  bandName = 'Bakandeya',
}) => {
  // Estado de expansión del briefing (por defecto plegado para no ocupar espacio, persistido en localStorage)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bm_morning_briefing_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleExpanded = (val?: boolean) => {
    const nextVal = val !== undefined ? val : !isExpanded;
    setIsExpanded(nextVal);
    try {
      localStorage.setItem('bm_morning_briefing_expanded', String(nextVal));
    } catch {
      // localStorage error fallback
    }
  };
  const [activeTab, setActiveTab] = useState<'priorities' | 'routing'>('priorities');

  // Ciudad ancla para el simulador de ruta (si no hay bolos confirmados)
  const [simulatorCity, setSimulatorCity] = useState<string>('Valencia');

  // --- 1. CLASIFICACIÓN DE ACCIONES PRIORITARIAS DE HOY ---
  const priorityItems = useMemo(() => {
    // 1. Leads con respuesta de la sala o estado respondido / negociando
    const repliedOrNegotiating = leads.filter((l) => {
      const status = (l.estado || '').toLowerCase();
      const hasIncoming = Boolean(l.ultimo_mensaje_recibido && l.ultimo_mensaje_recibido.trim() !== '');
      return status === 'respondido' || status === 'negociando' || status === 'interesado' || hasIncoming;
    });

    // 2. Borradores generados esperando aprobación humana (Human-in-the-Loop)
    const draftsToApprove = leads.filter((l) => (l.estado || '').toLowerCase() === 'pendiente_aprobacion');

    // 3. Leads contactados hace más de 7 días sin respuesta (seguimiento frío)
    const needsFollowup = leads.filter((l) => {
      const status = (l.estado || '').toLowerCase();
      return status === 'esperando_respuesta' || status === 'contactado';
    });

    // Priorizar los más calientes primero basándonos en el análisis de sentimiento e intención
    const hotLeads = repliedOrNegotiating
      .map((lead) => {
        const text = (lead.ultimo_mensaje_recibido || '').toLowerCase();
        let priorityType: 'hot' | 'budget' | 'schedule' | 'general' = 'general';
        let tagLabel = '💬 Conversación Activa';
        let tagColor = 'text-purple-400 bg-purple-500/15 border-purple-500/30';

        // Usar sentimiento/intención IA si está disponible
        if (
          lead.temperatura_lead === 'muy_caliente' ||
          lead.ultimo_sentimiento === 'muy_positivo' ||
          lead.ultima_intencion === 'confirmar_fecha' ||
          lead.ultima_intencion === 'proponer_fechas'
        ) {
          priorityType = 'hot';
          tagLabel = '🔥 Cierre / Fechas Receptivas';
          tagColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
        } else if (
          lead.ultima_intencion === 'pedir_cache' ||
          lead.condiciones_economicas_detectadas ||
          text.includes('presupuesto') ||
          text.includes('cache') ||
          text.includes('caché') ||
          text.includes('caro')
        ) {
          priorityType = 'budget';
          tagLabel = '💰 Negociación Económica';
          tagColor = 'text-sky-400 bg-sky-500/15 border-sky-500/30';
        } else if (
          lead.ultima_intencion === 'rechazo_programacion_llena' ||
          text.includes('cerrada') ||
          text.includes('llena') ||
          text.includes('temporada')
        ) {
          priorityType = 'schedule';
          tagLabel = '⏳ Temporada Completa';
          tagColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
        } else if (text.includes('interes') || text.includes('disponib') || text.includes('fecha') || text.includes('rider')) {
          priorityType = 'hot';
          tagLabel = '🔥 Interés Alto';
          tagColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
        }

        // Chequeo de conflicto de fechas propuestas con conciertos existentes
        const hasDateConflict = Boolean(
          lead.fechas_propuestas_sala &&
          lead.fechas_propuestas_sala.length > 0 &&
          concerts.some((c) => lead.fechas_propuestas_sala?.some((f) => f.toLowerCase().includes(c.ciudad?.toLowerCase() || '---')))
        );

        return {
          lead,
          priorityType,
          tagLabel,
          tagColor,
          isDraft: false,
          hasDateConflict,
        };
      })
      .sort((a, b) => {
        // Ordenar por score de sentimiento descendente
        const scoreA = a.lead.ultimo_sentimiento_score ?? (a.priorityType === 'hot' ? 0.8 : 0);
        const scoreB = b.lead.ultimo_sentimiento_score ?? (b.priorityType === 'hot' ? 0.8 : 0);
        return scoreB - scoreA;
      });

    // Añadir borradores pendientes de aprobación
    const draftItems = draftsToApprove.map((lead) => ({
      lead,
      priorityType: 'draft' as const,
      tagLabel: '📝 Borrador IA por Revisar',
      tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
      isDraft: true,
      hasDateConflict: false,
    }));

    return {
      all: [...hotLeads, ...draftItems].slice(0, 6),
      repliedCount: repliedOrNegotiating.length,
      draftCount: draftsToApprove.length,
      followupCount: needsFollowup.length,
    };
  }, [leads]);

  // --- 2. DETECCIÓN DE OPORTUNIDADES DE ENLACE DE RUTA ---
  const routingOpportunities = useMemo(() => {
    // Busca oportunidades combinando conciertos confirmados y leads en estado confirmado
    const virtualConcerts: Concert[] = [...concerts];

    // Convertir leads confirmados a objetos Concert si no están en concerts
    leads
      .filter((l) => l.estado === 'confirmado')
      .forEach((l) => {
        if (!virtualConcerts.some((c) => c.ciudad?.toLowerCase() === l.ciudad?.toLowerCase())) {
          virtualConcerts.push({
            id: `lead-conf-${l.id}`,
            fecha: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            ciudad: l.ciudad || 'Madrid',
            sala: l.nombre_sala,
            cache: 600,
            aforo_vendido: 0,
            aforo_total: l.aforo || 200,
            contrato_firmado: true,
            estado_pago: 'pendiente',
            notas: 'Lead confirmado en CRM',
            tipo: 'sala',
          });
        }
      });

    const calculated = findTourRoutingOpportunities(virtualConcerts, leads);
    return calculated;
  }, [concerts, leads]);

  // Simulador de corredor alternativo cuando no hay conciertos confirmados
  const simulatedCorridorOpportunities = useMemo(() => {
    const corridor = findCorridorForCity(simulatorCity);
    if (!corridor) return [];

    return leads
      .filter((l) => {
        const cCity = l.ciudad || l.region;
        const status = (l.estado || '').toLowerCase();
        return (
          status !== 'confirmado' &&
          status !== 'descartado' &&
          areCitiesLogisticallyCompatible(simulatorCity, cCity) &&
          cCity.toLowerCase() !== simulatorCity.toLowerCase()
        );
      })
      .slice(0, 4);
  }, [leads, simulatorCity]);

  // Generador de pitch de enlace de ruta
  const handleLaunchRoutePitch = (targetLead: Lead, anchorCity: string, approxDate: string) => {
    const pitch = `Hola equipo de ${targetLead.nombre_sala},\n\nEl próximo fin de semana de ${approxDate} estaremos tocando en ${anchorCity} con la gira de ${bandName} (furgoneta, técnico y producción al completo en la zona).\n\nNos encantaría aprovechar el viaje para enlazar fecha con vosotros el día previo o posterior y amortizar la ruta compartida. Os dejamos nuestro EPK y vídeo en directo:\nhttps://bandmanager.io/epk\n\n¿Tenéis disponibilidad en esa semana?\n\nUn abrazo,\nEquipo ${bandName}`;
    onSelectLead(targetLead, { tab: 'copilot', pitchDraft: pitch });
  };

  const totalActionCount = priorityItems.repliedCount + priorityItems.draftCount;

  return (
    <div className="w-full bg-[#161514] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* HEADER PRINCIPAL / RADAR DE ACCIÓN */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-sky-500/10 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider font-display flex items-center gap-1.5">
                Morning Briefing • Radar del Mánager
              </h3>
              {totalActionCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black font-mono animate-pulse">
                  {totalActionCount} urgentes
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Respuestas calientes, borradores agénticos y optimización de ruta para no perder dinero en carretera
            </p>
          </div>
        </div>

        {/* CONTROLES DEL BRIEFING: TABS Y TOGGLE */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-black/50 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('priorities');
                toggleExpanded(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'priorities' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Acción de Hoy ({priorityItems.all.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('routing');
                toggleExpanded(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'routing' ? 'bg-sky-500 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Enlaces de Ruta</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleExpanded()}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Plegar radar' : 'Desplegar radar'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* TAB 1: RADAR DE ACCIONES PRIORITARIAS DE HOY */}
          {activeTab === 'priorities' && (
            <div className="space-y-3">
              {priorityItems.all.length === 0 ? (
                <div className="p-6 text-center bg-black/30 rounded-xl border border-zinc-800/80 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-bold text-zinc-200 font-sans">
                    ¡Todo al día! No tienes respuestas pendientes ni borradores por aprobar.
                  </h4>
                  <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                    El agente Scout y el Enviador están monitorizando las salas en segundo plano. Explora nuevas oportunidades en el mapa o
                    importa contactos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {priorityItems.all.map(({ lead, priorityType, tagLabel, tagColor, isDraft, hasDateConflict }) => (
                    <div
                      key={lead.id}
                      className="bg-[#1C1B1A] p-3.5 rounded-xl border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3 shadow-md group"
                    >
                      <div className="space-y-2">
                        {/* Cabecera del Lead */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}>{tagLabel}</span>
                              {lead.ultimo_sentimiento_score !== undefined && (
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    lead.ultimo_sentimiento_score >= 0.4
                                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                      : lead.ultimo_sentimiento_score <= -0.3
                                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                        : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                  }`}
                                >
                                  {lead.ultimo_sentimiento_score > 0
                                    ? `+${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`
                                    : `${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-zinc-100 mt-0.5 group-hover:text-amber-400 transition-colors">
                              {lead.nombre_sala}
                            </h4>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              {lead.ciudad} • Aforo: {lead.aforo || 'n/d'}
                            </span>
                          </div>
                        </div>

                        {/* Entidades Detectadas (Fechas / Economía / Objeciones) */}
                        {((lead.fechas_propuestas_sala && lead.fechas_propuestas_sala.length > 0) ||
                          lead.condiciones_economicas_detectadas) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {lead.fechas_propuestas_sala && lead.fechas_propuestas_sala.length > 0 && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {lead.fechas_propuestas_sala.slice(0, 2).join(', ')}
                              </span>
                            )}
                            {lead.condiciones_economicas_detectadas?.cifra && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <DollarSign className="w-2.5 h-2.5" />
                                {lead.condiciones_economicas_detectadas.cifra}
                              </span>
                            )}
                            {hasDateConflict && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"
                                title="Posible coincidencia de ruta con bolo confirmado"
                              >
                                <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                                Enlace Ruta
                              </span>
                            )}
                          </div>
                        )}

                        {/* Mensaje / Extracto */}
                        <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                          {lead.ultimo_analisis_resumen ||
                            lead.ultimo_mensaje_recibido ||
                            lead.pitch_generado ||
                            lead.notas ||
                            'Sin historial reciente.'}
                        </div>

                        {/* Playbook Táctico Sugerido */}
                        {lead.estrategia_playbook && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 flex items-center justify-between gap-1">
                            <span className="truncate font-medium">⚡ {lead.estrategia_playbook.titulo}</span>
                            <button
                              type="button"
                              onClick={() => onSelectLead(lead, { tab: 'emails', pitchDraft: lead.estrategia_playbook?.propuesta_rapida })}
                              className="text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded shrink-0 hover:bg-amber-400 cursor-pointer"
                              title="Aplicar propuesta rápida"
                            >
                              Aplicar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción rápida */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead, { tab: 'copilot' })}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Copiloto</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {onOpenRoadbookModal && (
                            <button
                              type="button"
                              onClick={() => onOpenRoadbookModal(lead)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                              title="Ver / Imprimir Roadbook & Contrato"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectLead(lead, { tab: 'emails' })}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Atender</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPTIMIZADOR DE ENLACE DE FECHAS (ROUTING MATCH) */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              {routingOpportunities.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-sky-300 font-medium">🎯 Oportunidades detectadas vinculadas a tus fechas confirmadas</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ahorro medio en furgoneta: ~180€ / bolo</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {routingOpportunities.map((opp, idx) => (
                      <div key={idx} className="bg-[#1C1B1A] p-4 rounded-xl border border-zinc-800 space-y-3 shadow-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                              EJE LOGÍSTICO: {opp.corridorName}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">
                              Bolo en {opp.concertCity} ({opp.concertDateStr})
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">{opp.suggestedAction}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
                            {opp.candidateLeads.length} salas compatibles
                          </span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                            Salas candidatas para el fin de semana:
                          </span>
                          <div className="space-y-1.5">
                            {opp.candidateLeads.map((candidate) => (
                              <div
                                key={candidate.id}
                                className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="text-xs font-bold text-zinc-200 block">
                                    {candidate.nombre_sala} ({candidate.ciudad})
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    Aforo: {candidate.aforo || 'n/d'} pax • Estado: {candidate.estado}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleLaunchRoutePitch(candidate, opp.concertCity, opp.concertDateStr)}
                                  className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Pitch de Ruta</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Simulador de Enlace si aún no hay bolos confirmados */
                <div className="space-y-3">
                  <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-5 h-5 text-sky-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200 uppercase font-sans">Simulador de Clúster de Gira y Corredor</h4>
                        <p className="text-[11px] text-zinc-400">
                          Elige una ciudad ancla para proyectar un fin de semana doble o triple en ruta:
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">Ciudad Ancla:</span>
                      <select
                        value={simulatorCity}
                        onChange={(e) => setSimulatorCity(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1 font-sans focus:outline-none focus:border-sky-500"
                      >
                        <option value="Valencia">Valencia (Eje Mediterráneo)</option>
                        <option value="Barcelona">Barcelona (Eje Mediterráneo)</option>
                        <option value="Madrid">Madrid (Eje Centro)</option>
                        <option value="Zaragoza">Zaragoza (Eje Ebro)</option>
                        <option value="Bilbao">Bilbao (Eje Cantábrico / Ebro)</option>
                        <option value="Sevilla">Sevilla (Eje Sur)</option>
                        <option value="Valladolid">Valladolid (Eje Castilla)</option>
                      </select>
                    </div>
                  </div>

                  {simulatedCorridorOpportunities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {simulatedCorridorOpportunities.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-3 bg-[#1A1918] rounded-xl border border-zinc-800 flex flex-col justify-between space-y-2.5 shadow"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-sky-400 block font-bold">{lead.ciudad}</span>
                            <h5 className="text-xs font-bold text-zinc-200 mt-0.5">{lead.nombre_sala}</h5>
                            <span className="text-[10px] text-zinc-400 block">
                              Aforo: {lead.aforo || 'n/d'} pax • {lead.tipo}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleLaunchRoutePitch(lead, simulatorCity, 'el próximo mes')}
                            className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Proponer Fecha Doble</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-black/30 rounded-xl border border-zinc-800 text-center text-xs text-zinc-400">
                      No hay salas registradas en el CRM en ciudades limítrofes a {simulatorCity}. Usa el Scout para descubrir salas en esa
                      provincia.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
