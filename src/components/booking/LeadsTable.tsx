import React, { useState, useRef, useEffect } from 'react';
import { Lead, LeadStatus, LeadType } from '../../types';
import { LeadHealthBadge } from './LeadHealthBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReliabilityBadge } from '../common/ReliabilityBadge';
import { FavoriteButton } from '../common/FavoriteButton';
import { isLeadVerificado } from '../../utils/leadReliability';
import { 
  MessageCircle, 
  PhoneCall, 
  Phone, 
  Smartphone, 
  CheckCircle2, 
  Eye, 
  Sparkles, 
  Trash2, 
  Camera, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  AlertCircle, 
  Instagram, 
  CalendarCheck, 
  Loader2,
  Calendar,
  Coins,
  Flame,
  TrendingUp,
  Zap,
  Clock,
  Sliders
} from 'lucide-react';
import { ChangeLeadImageModal } from './ChangeLeadImageModal';
import { LeadAvatar } from './LeadAvatar';
import { EmailDeliveryTicks } from './EmailDeliveryTicks';
import { useEmailValidation, getEmailStatus, isBouncedLead } from '../../hooks/useEmailValidation';
import { getWhatsAppUrl, openWhatsAppChat, WHATSAPP_WINDOW_NAME } from '../../utils/whatsapp';

interface LeadsTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  viewMode: 'grid' | 'table';
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  normalizeType: (type?: string) => string;
  sectionTab?: 'salas' | 'medios' | 'grupos';
  mediaTypeFilter?: 'televisión' | 'radio' | 'redes' | 'managements' | 'todos';
  setMediaTypeFilter?: (type: 'televisión' | 'radio' | 'redes' | 'managements' | 'todos') => void;
  selectedLeadIds?: string[];
  onToggleSelectLead?: (id: string, e?: React.MouseEvent) => void;
  onSelectAllFiltered?: () => void;
  onDeselectAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLead,
  onDeleteLead,
  onLeadLogoUpload,
  viewMode,
  getStatusBadgeClass,
  getStatusLabel,
  normalizeType,
  sectionTab = 'salas',
  mediaTypeFilter = 'todos',
  setMediaTypeFilter,
  selectedLeadIds = [],
  onToggleSelectLead,
  onSelectAllFiltered,
  onDeselectAll,
  isAllSelected = false,
  isSomeSelected = false
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected && !isAllSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  const filteredLeads = mediaTypeFilter === 'todos' || !setMediaTypeFilter
    ? leads
    : leads.filter(l => l.genero?.toLowerCase() === mediaTypeFilter);

  const [leadForImageChange, setLeadForImageChange] = useState<Lead | null>(null);
  const [isScanningBatchDates, setIsScanningBatchDates] = useState(false);
  const [batchScanResult, setBatchScanResult] = useState<string | null>(null);
  const { emailValidities } = useEmailValidation();

  const handleBatchScanDates = async () => {
    try {
      setIsScanningBatchDates(true);
      setBatchScanResult(null);

      const targetIds = selectedLeadIds.length > 0
        ? selectedLeadIds
        : filteredLeads.map(l => l.id);

      const res = await fetch('/api/leads/detect-all-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: targetIds })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.updatedLeads)) {
        data.updatedLeads.forEach((updated: Lead) => {
          onUpdateLead(updated.id, updated);
        });
        setBatchScanResult(`✅ Escaneados ${data.processedCount} recintos. ¡${data.totalFreeDates} fechas libres detectadas en total!`);
      } else {
        setBatchScanResult(`⚠️ ${data.error || 'No se pudieron detectar fechas en lote'}`);
      }
    } catch (err: any) {
      setBatchScanResult(`❌ Error: ${err?.message || 'Error de conexión'}`);
    } finally {
      setIsScanningBatchDates(false);
    }
  };

  const handleQuickApprovePitch = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { estado: 'aprobado' });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const renderTipoBadge = (tipoRaw?: string) => {
    const t = (tipoRaw || 'sala').toLowerCase().trim();
    if (t === 'festival') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 shrink-0">🎪 Festival</span>;
    }
    if (t === 'discoteca' || t === 'club') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-pink-950/80 text-pink-300 border border-pink-800/60 shrink-0">🪩 Club</span>;
    }
    if (t === 'teatro' || t === 'auditorio') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0">🎭 Teatro</span>;
    }
    if (t === 'ayuntamiento') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 shrink-0">🏛️ Ayto</span>;
    }
    if (t === 'medio' || t === 'prensa' || t === 'radio' || t === 'televisión') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/60 shrink-0">📻 Medio</span>;
    }
    if (t === 'agencia' || t === 'manager' || t === 'promotor' || t === 'sello') {
      return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0">💼 Agencia</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700/60 shrink-0">🏛️ Sala</span>;
  };

  const renderTemperatureBadge = (lead: Lead) => {
    const temp = lead.temperatura_lead;
    if (temp === 'muy_caliente' || lead.ultimo_sentimiento === 'muy_positivo') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 animate-pulse shadow-xs" title="Lead muy receptivo / Cierre inminente">
          <Flame className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
          <span>Muy Caliente</span>
        </span>
      );
    }
    if (temp === 'caliente' || (lead.ultimo_sentimiento_score && lead.ultimo_sentimiento_score >= 0.4)) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 shadow-xs" title="Interés alto">
          <Flame className="w-2.5 h-2.5 text-amber-400" />
          <span>Caliente</span>
        </span>
      );
    }
    if (temp === 'tibio') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0" title="En evaluación / Interés templado">
          <span>🌤️ Tibio</span>
        </span>
      );
    }
    if (temp === 'frio' || temp === 'congelado') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0" title="Sin respuesta o baja tracción">
          <span>❄️ Frío</span>
        </span>
      );
    }
    return null;
  };

  const renderIntentBadge = (lead: Lead) => {
    const intent = lead.ultima_intencion;
    if (!intent) return null;
    
    if (intent === 'confirmar_fecha' || intent === 'proponer_fechas') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">📅 Pide Fechas</span>;
    }
    if (intent === 'pedir_cache') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30">💰 Negociación Caché</span>;
    }
    if (intent === 'pedir_info_tecnica') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">🎛️ Pide Rider</span>;
    }
    if (intent === 'rechazo_programacion_llena') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">⏳ Prog. Llena</span>;
    }
    if (intent === 'derivar_contacto') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">📋 Deriva Contacto</span>;
    }
    return null;
  };

  if (filteredLeads.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#121110] border border-zinc-800/80 my-4">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
        <p className="text-zinc-300 font-bold text-sm">No se encontraron medios o espacios</p>
        <p className="text-zinc-500 text-xs mt-1">Prueba a cambiar los filtros o los términos de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Filter Tabs & Selection Bar if applicable */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {sectionTab === 'medios' && setMediaTypeFilter && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['todos', 'televisión', 'radio', 'redes', 'managements'].map((type) => (
              <button
                key={type}
                onClick={() => setMediaTypeFilter(type as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  mediaTypeFilter === type 
                    ? 'bg-[#f2ca50] text-black' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Quick select buttons in Grid view */}
        {viewMode === 'grid' && onToggleSelectLead && (
          <div className="flex items-center gap-2 text-xs font-mono ml-auto">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAllFiltered}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[#f2ca50]" />
                  <span>Deseleccionar todos ({filteredLeads.length})</span>
                </>
              ) : isSomeSelected ? (
                <>
                  <MinusSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              )}
            </button>
            {selectedLeadIds.length > 0 && (
              <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px]">
                {selectedLeadIds.length} selecc.
              </span>
            )}

            <button
              type="button"
              onClick={handleBatchScanDates}
              disabled={isScanningBatchDates}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-600/60 text-sky-200 hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 text-xs font-sans font-semibold"
              title="Escanea las carteleras de los recintos de la campaña para detectar sus fines de semana libres"
            >
              {isScanningBatchDates ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              ) : (
                <CalendarCheck className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>
                {isScanningBatchDates
                  ? 'Escaneando carteleras...'
                  : `📡 Radar Fechas Libres (${selectedLeadIds.length > 0 ? selectedLeadIds.length : 'Campaña'})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {batchScanResult && (
        <div className="mb-3 p-2.5 rounded-xl bg-sky-950/60 border border-sky-600/50 text-sky-200 text-xs font-sans flex items-center justify-between gap-2 animate-fadeIn">
          <span>{batchScanResult}</span>
          <button
            type="button"
            onClick={() => setBatchScanResult(null)}
            className="text-sky-400 hover:text-white text-xs font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className={`grid gap-4 pb-10 transition-all duration-300 ${
          selectedLead 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        }`}>
          {filteredLeads.map((lead, idx) => {
            const isDetailOpen = selectedLead?.id === lead.id;
            const isChecked = selectedLeadIds.includes(lead.id);
            const rawMovil = (lead.telefono_movil || '').trim() || 
              (!lead.telefono_fijo && lead.telefono && /^(?:\+?34\s*)?[67]/.test(lead.telefono.trim()) ? lead.telefono.trim() : '');
            const rawFijo = (lead.telefono_fijo || '').trim() || 
              (!lead.telefono_movil && lead.telefono && /^(?:\+?34\s*)?[89]/.test(lead.telefono.trim()) ? lead.telefono.trim() : '');
            const hasMovil = Boolean(rawMovil && rawMovil.length >= 6);
            const hasFijo = Boolean(rawFijo && rawFijo.length >= 6);
            // WhatsApp sólo disponible si se dispone de teléfono móvil
            const phoneForWhatsApp = hasMovil ? cleanPhone(rawMovil) : null;
            const phoneForCall = rawMovil || rawFijo || lead.telefono;
            const leadKey = lead.id ? `lead-grid-${lead.id}` : `lead-grid-${idx}`;

            // Check if there is high-value intelligence on this lead
            const hasIntelligence = Boolean(
              lead.ultimo_sentimiento_score !== undefined ||
              lead.temperatura_lead ||
              lead.ultima_intencion ||
              (lead.fechas_propuestas_sala && lead.fechas_propuestas_sala.length > 0) ||
              lead.condiciones_economicas_detectadas ||
              lead.ultimo_analisis_resumen ||
              lead.estrategia_playbook ||
              lead.ultimo_mensaje_recibido
            );

            return (
              <div
                key={leadKey}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 relative group shadow-md ${
                  isChecked
                    ? 'bg-[#1e1c17] border-2 border-[#f2ca50] shadow-xl ring-2 ring-[#f2ca50]/25'
                    : isDetailOpen
                    ? 'bg-[#1A1918] border-2 border-amber-400/90 shadow-xl ring-2 ring-amber-400/20'
                    : 'bg-[#131211] border border-zinc-800/90 hover:bg-[#181716] hover:border-zinc-700'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start gap-2.5 min-w-0 w-full">
                  {/* Select Checkbox (Grid Mode) */}
                  {onToggleSelectLead && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectLead(lead.id, e);
                      }}
                      className="shrink-0 pt-0.5 cursor-pointer"
                      title={isChecked ? "Deseleccionar sala" : "Seleccionar sala para acciones masivas"}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-[#f2ca50] border-[#f2ca50] text-black shadow-xs' 
                          : 'border-zinc-600 group-hover:border-zinc-400 bg-zinc-900/80 hover:border-amber-400'
                      }`}>
                        {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* Interactive Avatar Container */}
                  <LeadAvatar
                    lead={lead}
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadForImageChange(lead);
                    }}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <h4 className="font-display font-bold text-base sm:text-lg tracking-wide text-zinc-50 truncate notranslate" translate="no">
                          {lead.nombre_sala}
                        </h4>
                        <VerifiedBadge isVerified={isLeadVerificado(lead)} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <FavoriteButton 
                          isFavorite={!!lead.es_favorito}
                          onToggle={(newVal) => onUpdateLead(lead.id, { es_favorito: newVal })}
                          size="sm"
                        />
                        <span
                          className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium shrink-0 ${getStatusBadgeClass(
                            lead.estado
                          )}`}
                        >
                          {getStatusLabel(lead.estado)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-zinc-300 font-medium mt-1">
                      {renderTipoBadge(lead.tipo)}
                      <span className="text-zinc-200 font-semibold">{lead.ciudad || 'España'}</span>
                      <span>•</span>
                      <span className={lead.roster ? 'text-amber-300 font-semibold' : ''}>
                        {lead.roster 
                          ? `Róster: ${lead.roster}` 
                          : (['agencia', 'manager', 'productora', 'sello'].includes(String(lead.tipo || '').toLowerCase())
                              ? 'Agencia / Booking'
                              : (lead.aforo ? `${lead.aforo} pax` : 'Aforo n/d'))}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-400">{lead.genero || 'Variado'}</span>
                    </div>

                    {/* Temperatura & Intención Directas */}
                    {(lead.temperatura_lead || lead.ultima_intencion || lead.ultimo_sentimiento_score !== undefined) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {renderTemperatureBadge(lead)}
                        {renderIntentBadge(lead)}
                        {lead.ultimo_sentimiento_score !== undefined && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            lead.ultimo_sentimiento_score >= 0.4
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : lead.ultimo_sentimiento_score <= -0.3
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                              : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                          }`}>
                            {lead.ultimo_sentimiento_score > 0 ? `+${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%` : `${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Intelligence & Deal Box (Fechas, Economía, Resumen o Playbook) */}
                {hasIntelligence && (
                  <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                    {/* Entidades Detectadas: Fechas y Economía */}
                    {((lead.fechas_propuestas_sala && lead.fechas_propuestas_sala.length > 0) || lead.condiciones_economicas_detectadas) && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-zinc-800/70">
                        {lead.fechas_propuestas_sala && lead.fechas_propuestas_sala.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-semibold" title={`Fechas propuestas por la sala: ${lead.fechas_propuestas_sala.join(', ')}`}>
                            <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{lead.fechas_propuestas_sala.slice(0, 2).join(', ')}</span>
                          </span>
                        )}
                        {lead.condiciones_economicas_detectadas?.cifra && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold" title={`Condiciones económicas: ${lead.condiciones_economicas_detectadas.tipo || ''} ${lead.condiciones_economicas_detectadas.detalles || ''}`}>
                            <Coins className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{lead.condiciones_economicas_detectadas.cifra}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Resumen Ejecutivo / Último Mensaje */}
                    {(lead.ultimo_analisis_resumen || lead.ultimo_mensaje_recibido) && (
                      <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed italic">
                        "{lead.ultimo_analisis_resumen || lead.ultimo_mensaje_recibido}"
                      </p>
                    )}

                    {/* Tactical Playbook Chip */}
                    {lead.estrategia_playbook && (
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center justify-between gap-1">
                        <span className="truncate font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{lead.estrategia_playbook.titulo}</span>
                        </span>
                        {lead.estrategia_playbook.propuesta_rapida && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(lead);
                            }}
                            className="text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded shrink-0 hover:bg-amber-400 cursor-pointer shadow-xs"
                            title="Ver propuesta táctica en ficha"
                          >
                            Playbook ⚡
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quality Badges, Delivery Status & Phone Indicators */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <EmailDeliveryTicks lead={lead} size="sm" showLabel={true} />
                  <LeadHealthBadge lead={lead} showDescription={true} size="sm" />
                  <ReliabilityBadge item={lead} size="sm" />

                  {/* Icono de Teléfono Móvil disponible */}
                  {hasMovil ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 shadow-2xs"
                      title={`Teléfono móvil (WhatsApp disponible): ${rawMovil}`}
                    >
                      <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="hidden xs:inline">Móvil</span>
                    </span>
                  ) : null}

                  {/* Icono de Teléfono Fijo disponible */}
                  {hasFijo ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-sky-950/80 border border-sky-700/70 text-sky-300 shadow-2xs"
                      title={`Teléfono fijo de sala: ${rawFijo}`}
                    >
                      <Phone className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="hidden xs:inline">Fijo</span>
                    </span>
                  ) : null}

                  {/* Icono de Instagram disponible */}
                  {lead.instagram ? (
                    <a
                      href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-pink-950/80 border border-pink-700/70 text-pink-300 shadow-2xs hover:bg-pink-900 transition-colors"
                      title={`Instagram: ${lead.instagram}`}
                    >
                      <Instagram className="w-3 h-3 text-pink-400 shrink-0" />
                      <span className="hidden xs:inline">{lead.instagram.startsWith('@') ? lead.instagram : `@${lead.instagram}`}</span>
                    </a>
                  ) : null}

                  {/* Icono de Fechas Libres detectadas por radar */}
                  {lead.fechas_libres_detectadas && lead.fechas_libres_detectadas.length > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-sky-950/90 border border-sky-600/80 text-sky-300 shadow-2xs cursor-pointer hover:bg-sky-900 transition-colors"
                      title={`Fechas libres detectadas por radar: ${lead.fechas_libres_detectadas.join(', ')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                    >
                      <CalendarCheck className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{lead.fechas_libres_detectadas.length} fecha(s) libre(s)</span>
                    </span>
                  ) : null}
                </div>

                {/* Direct Action Bar (WhatsApp, Call, Quick Pitch Approve, View) */}
                <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 w-full mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Direct WhatsApp Button — SOLO se muestra si tenemos teléfono móvil */}
                    {hasMovil && phoneForWhatsApp ? (
                      <a
                        href={getWhatsAppUrl(rawMovil)}
                        target={WHATSAPP_WINDOW_NAME}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openWhatsAppChat(rawMovil);
                        }}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title={`Enviar WhatsApp directo al móvil (${rawMovil})`}
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="hidden xs:inline text-[11px]">WhatsApp</span>
                      </a>
                    ) : null}

                    {/* Direct Instagram Button */}
                    {lead.instagram ? (
                      <a
                        href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-pink-950/80 hover:bg-pink-900 border border-pink-700/60 text-pink-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title={`Abrir Instagram (${lead.instagram})`}
                      >
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span className="hidden xs:inline text-[11px]">Instagram</span>
                      </a>
                    ) : null}

                    {/* Direct Call Button */}
                    {phoneForCall ? (
                      <a
                        href={`tel:${phoneForCall}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title={
                          hasMovil && hasFijo 
                            ? `Llamar (Móvil: ${rawMovil} / Fijo: ${rawFijo})` 
                            : hasMovil 
                            ? `Llamar al móvil (${rawMovil})` 
                            : `Llamar al fijo (${rawFijo})`
                        }
                      >
                        <PhoneCall className="w-4 h-4 text-sky-400" />
                        <span className="hidden xs:inline text-[11px]">Llamar</span>
                      </a>
                    ) : null}

                    {/* Direct Pitch Approval Button if pending */}
                    {(lead.estado === 'pendiente_aprobacion' || lead.estado === 'nuevo') && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickApprovePitch(e, lead)}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[38px]"
                        title="Aprobar pitch directamente para envío"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px]">Aprobar</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
                        isDetailOpen
                          ? 'bg-[#f2ca50] text-[#3c2f00] shadow-md'
                          : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/80'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{hasIntelligence ? 'Copiloto' : 'Ficha'}</span>
                    </button>
                    {onDeleteLead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLead(lead.id, lead.nombre_sala);
                        }}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl transition-all cursor-pointer min-h-[38px] flex items-center justify-center"
                        title="Eliminar y guardar en lista negra"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#121110] shadow-lg pb-10">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-black/40">
                
                {/* Select All Checkbox Header */}
                {onToggleSelectLead && (
                  <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        ref={headerCheckboxRef}
                        checked={isAllSelected}
                        onChange={isAllSelected ? onDeselectAll : onSelectAllFiltered}
                        className="w-4 h-4 rounded border-zinc-700 text-[#f2ca50] focus:ring-[#f2ca50]/50 bg-zinc-900 cursor-pointer accent-[#f2ca50]"
                        title={isAllSelected ? "Deseleccionar todos" : "Seleccionar todos los resultados"}
                      />
                    </div>
                  </th>
                )}

                <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">Fav</th>
                <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">
                  {sectionTab === 'medios' ? 'Medio / Contacto' : sectionTab === 'grupos' ? 'Banda / Management' : 'Espacio / Nombre'}
                </th>
                <th className="py-3.5 px-3 min-w-[100px] whitespace-nowrap">Tipo</th>
                <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">Fiabilidad</th>
                <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">Salud / Temp</th>
                <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">Ciudad</th>
                <th className="py-3.5 px-4 min-w-[90px] whitespace-nowrap">
                  {sectionTab === 'grupos' ? 'Róster / Aforo' : 'Aforo'}
                </th>
                <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">Estado</th>
                <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">Contacto / Directo</th>
                <th className="py-3.5 px-4 min-w-[160px] text-right whitespace-nowrap">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs font-mono align-middle">
              {filteredLeads.map((lead, idx) => {
                const isDetailOpen = selectedLead?.id === lead.id;
                const isChecked = selectedLeadIds.includes(lead.id);
                const rawMovil = (lead.telefono_movil || '').trim() || 
                  (!lead.telefono_fijo && lead.telefono && /^(?:\+?34\s*)?[67]/.test(lead.telefono.trim()) ? lead.telefono.trim() : '');
                const rawFijo = (lead.telefono_fijo || '').trim() || 
                  (!lead.telefono_movil && lead.telefono && /^(?:\+?34\s*)?[89]/.test(lead.telefono.trim()) ? lead.telefono.trim() : '');
                const hasMovil = Boolean(rawMovil && rawMovil.length >= 6);
                const hasFijo = Boolean(rawFijo && rawFijo.length >= 6);
                // WhatsApp sólo disponible si se dispone de teléfono móvil
                const phoneForWhatsApp = hasMovil ? cleanPhone(rawMovil) : null;
                const phoneForCall = rawMovil || rawFijo || lead.telefono;
                const leadKey = lead.id ? `lead-row-${lead.id}` : `lead-row-${idx}`;

                return (
                  <tr
                    key={leadKey}
                    onClick={() => onSelectLead(lead)}
                    className={`transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[#1e1c17] border-l-2 border-l-[#f2ca50]'
                        : isDetailOpen 
                        ? 'bg-[#1A1918] border-l-2 border-l-purple-400' 
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    {onToggleSelectLead && (
                      <td 
                        className="py-3.5 px-3 text-center align-middle" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectLead(lead.id, e);
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelectLead(lead.id, e);
                            }}
                            className="w-4 h-4 rounded border-zinc-700 text-[#f2ca50] focus:ring-[#f2ca50]/50 bg-zinc-900 cursor-pointer accent-[#f2ca50]"
                            title={isChecked ? "Deseleccionar" : "Seleccionar"}
                          />
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton 
                        isFavorite={!!lead.es_favorito}
                        onToggle={(newVal) => onUpdateLead(lead.id, { es_favorito: newVal })}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 min-w-[200px] align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Interactive Avatar Container Table View */}
                        <LeadAvatar
                          lead={lead}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadForImageChange(lead);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-bold text-xs sm:text-sm text-zinc-100 block max-w-[160px] notranslate" translate="no" title={lead.nombre_sala}>
                              {lead.nombre_sala}
                            </span>
                            <VerifiedBadge isVerified={isLeadVerificado(lead)} size="sm" />
                          </div>
                          <span className="text-[10px] text-zinc-400 font-sans font-normal truncate block">
                            {lead.genero || 'Sin género'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 min-w-[100px] whitespace-nowrap align-middle">
                      {renderTipoBadge(lead.tipo)}
                    </td>

                    <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap align-middle">
                      <ReliabilityBadge item={lead} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 min-w-[130px] whitespace-nowrap align-middle">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <LeadHealthBadge lead={lead} showDescription={false} size="sm" />
                          {renderTemperatureBadge(lead)}
                        </div>
                        {renderIntentBadge(lead)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[110px] text-zinc-300 align-middle">
                      <span className="font-semibold block">{lead.ciudad || 'España'}</span>
                      {lead.fechas_libres_detectadas && lead.fechas_libres_detectadas.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-sans font-medium mt-0.5 cursor-pointer hover:underline"
                          title={`Fechas libres detectadas por radar: ${lead.fechas_libres_detectadas.join(', ')}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                        >
                          <CalendarCheck className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>{lead.fechas_libres_detectadas.length} fecha(s) libre(s)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-[90px] text-zinc-300 align-middle">
                      <span className={lead.roster ? 'text-amber-300 font-semibold' : 'text-zinc-200'}>
                        {lead.roster ? `Róster: ${lead.roster}` : (lead.aforo ? `${lead.aforo} pax` : 'n/d')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px] whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${getStatusBadgeClass(
                            lead.estado
                          )}`}
                        >
                          {getStatusLabel(lead.estado)}
                        </span>
                        <EmailDeliveryTicks lead={lead} size="sm" showLabel={false} />
                      </div>
                    </td>

                    {/* Direct Contact Column */}
                    <td className="py-3.5 px-4 min-w-[180px] align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {lead.email_contacto ? (
                            <>
                              {(() => {
                                const bounced = isBouncedLead(lead.notas);
                                const invalid = getEmailStatus(lead.id, lead.email_contacto, emailValidities) === 'invalid';
                                const broken = bounced || invalid;
                                return (
                                  <>
                                    <a
                                      href={`mailto:${lead.email_contacto}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`font-normal truncate max-w-[140px] inline-block ${
                                        broken
                                          ? 'text-red-400 hover:text-red-300 line-through'
                                          : 'text-sky-400 hover:text-sky-300'
                                      }`}
                                      title={lead.email_contacto}
                                    >
                                      {lead.email_contacto}
                                    </a>
                                    {broken && (
                                      <div title={bounced ? 'Email rebotado - el destinatario no existe' : 'Email inválido - no se puede contactar'}>
                                        <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">Sin email</span>
                          )}
                        </div>
                        {/* Teléfono Móvil con icono Smartphone */}
                        {hasMovil ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]" title={`Móvil (WhatsApp disponible): ${rawMovil}`}>
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{rawMovil}</span>
                          </div>
                        ) : null}

                        {/* Teléfono Fijo con icono Phone */}
                        {hasFijo ? (
                          <div className="flex items-center gap-1.5 text-sky-400 font-medium text-[11px]" title={`Teléfono fijo de sala: ${rawFijo}`}>
                            <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate">{rawFijo}</span>
                          </div>
                        ) : null}

                        {!hasMovil && !hasFijo && lead.telefono ? (
                          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]" title={`Teléfono: ${lead.telefono}`}>
                            <PhoneCall className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{lead.telefono}</span>
                          </div>
                        ) : null}

                        {/* Instagram con icono Instagram */}
                        {lead.instagram ? (
                          <a
                            href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-medium text-[11px] transition-colors"
                            title={`Instagram: ${lead.instagram}`}
                          >
                            <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                            <span className="truncate">{lead.instagram.startsWith('@') ? lead.instagram : `@${lead.instagram}`}</span>
                          </a>
                        ) : null}
                      </div>
                    </td>

                    {/* Direct Quick Action Buttons in Table View */}
                    <td className="py-3.5 px-4 min-w-[160px] text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp: SOLO si tiene teléfono móvil */}
                        {hasMovil && phoneForWhatsApp ? (
                          <a
                            href={getWhatsAppUrl(rawMovil)}
                            target={WHATSAPP_WINDOW_NAME}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openWhatsAppChat(rawMovil);
                            }}
                            className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg transition-colors inline-flex items-center"
                            title={`WhatsApp directo al móvil (${rawMovil})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        ) : null}

                        {/* Instagram: SOLO si tiene instagram */}
                        {lead.instagram ? (
                          <a
                            href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-pink-950/80 hover:bg-pink-900 border border-pink-700/60 text-pink-300 rounded-lg transition-colors inline-flex items-center"
                            title={`Abrir perfil de Instagram (${lead.instagram})`}
                          >
                            <Instagram className="w-3.5 h-3.5 text-pink-400" />
                          </a>
                        ) : null}

                        {phoneForCall ? (
                          <a
                            href={`tel:${phoneForCall}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded-lg transition-colors inline-flex items-center"
                            title={
                              hasMovil && hasFijo 
                                ? `Llamar (Móvil: ${rawMovil} / Fijo: ${rawFijo})` 
                                : hasMovil 
                                ? `Llamar al móvil (${rawMovil})` 
                                : `Llamar al fijo (${rawFijo})`
                            }
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                          </a>
                        ) : null}

                        {(lead.estado === 'pendiente_aprobacion' || lead.estado === 'nuevo') && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprovePitch(e, lead)}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Aprobar pitch directamente"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            <span>Aprobar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className={`p-1.5 rounded-lg transition-colors inline-flex items-center ${
                            isDetailOpen
                              ? 'bg-[#f2ca50] text-black font-bold'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                          title="Abrir ficha"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Image Modal */}
      {leadForImageChange && (
        <ChangeLeadImageModal
          lead={leadForImageChange}
          isOpen={Boolean(leadForImageChange)}
          onClose={() => setLeadForImageChange(null)}
          onUpdateLead={(id, updates) => {
            onUpdateLead(id, updates);
            setLeadForImageChange(null);
          }}
          onLeadLogoUpload={onLeadLogoUpload}
        />
      )}
    </div>
  );
};
