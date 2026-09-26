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
  CheckCircle2,
  Eye,
  Sparkles,
  Trash2,
  Camera,
  CheckSquare,
  Square,
  MinusSquare,
  AlertCircle,
} from 'lucide-react';
import { ChangeLeadImageModal } from './ChangeLeadImageModal';
import { LeadAvatar } from './LeadAvatar';
import {
  useEmailValidation,
  getEmailStatus,
  isBouncedLead,
} from '../../hooks/useEmailValidation';

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
  setMediaTypeFilter?: (
    type: 'televisión' | 'radio' | 'redes' | 'managements' | 'todos'
  ) => void;
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
  isSomeSelected = false,
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        isSomeSelected && !isAllSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  const filteredLeads =
    mediaTypeFilter === 'todos' || !setMediaTypeFilter
      ? leads
      : leads.filter((l) => l.genero?.toLowerCase() === mediaTypeFilter);

  const [leadForImageChange, setLeadForImageChange] = useState<Lead | null>(
    null
  );
  const { emailValidities } = useEmailValidation();

  const handleQuickApprovePitch = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { estado: 'aprobado' });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  if (filteredLeads.length === 0) {
    return (
      <div className="p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)] my-4">
        <Sparkles className="w-8 h-8 text-[var(--acc-ink)] mx-auto mb-2 opacity-60" />
        <p className="text-[var(--ink-2)] font-bold text-sm">
          No se encontraron medios o espacios
        </p>
        <p className="text-[var(--ink-2)] text-xs mt-1">
          Prueba a cambiar los filtros o los términos de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Filter Tabs & Selection Bar if applicable */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {sectionTab === 'medios' && setMediaTypeFilter && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['todos', 'televisión', 'radio', 'redes', 'managements'].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setMediaTypeFilter(type as any)}
                  className={`px-3 py-1 rounded-[var(--r-pill)] text-xs font-bold capitalize transition-colors cursor-pointer ${
                    mediaTypeFilter === type
                      ? 'bg-[var(--acc)] text-[var(--on-acc)]'
                      : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        )}

        {/* Quick select buttons in Grid view */}
        {viewMode === 'grid' && onToggleSelectLead && (
          <div className="flex items-center gap-2 text-xs font-sans ml-auto">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAllFiltered}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--bg)]/90 hover:bg-[var(--surface)]700 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Deseleccionar todos ({filteredLeads.length})</span>
                </>
              ) : isSomeSelected ? (
                <>
                  <MinusSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              )}
            </button>
            {selectedLeadIds.length > 0 && (
              <span className="text-[var(--acc)] font-bold bg-[var(--acc)]/15 px-2 py-0.5 rounded-md text-[11px]">
                {selectedLeadIds.length} selecc.
              </span>
            )}
          </div>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div
          className={`grid gap-4 pb-10 transition-all duration-300 ${
            selectedLead
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}
        >
          {filteredLeads.map((lead, idx) => {
            const isDetailOpen = selectedLead?.id === lead.id;
            const isChecked = selectedLeadIds.includes(lead.id);
            const phoneClean = cleanPhone(lead.telefono);
            const leadKey = lead.id
              ? `lead-grid-${lead.id}`
              : `lead-grid-${idx}`;

            return (
              <div
                key={leadKey}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-[var(--r-l)] transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isChecked
                    ? 'bg-[var(--surface)] ring-2 ring-[var(--acc)]/25'
                    : isDetailOpen
                      ? 'bg-[var(--sunken)] ring-1 ring-purple-400/30'
                      : 'bg-[var(--bg)] hover:bg-[var(--sunken)] hover:border-[var(--hair)]700'
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
                      title={
                        isChecked
                          ? 'Deseleccionar sala'
                          : 'Seleccionar sala para acciones masivas'
                      }
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[var(--acc)] text-[var(--ink)]'
                            : 'border-[var(--hair)]600 group-hover:border-[var(--hair)]400 bg-[var(--bg)]/80 hover:'
                        }`}
                      >
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
                        <h4
                          className="font-display font-bold text-base sm:text-lg tracking-wide text-[var(--ink)] truncate notranslate"
                          translate="no"
                        >
                          {lead.nombre_sala}
                        </h4>
                        <VerifiedBadge
                          isVerified={isLeadVerificado(lead)}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <FavoriteButton
                          isFavorite={!!lead.es_favorito}
                          onToggle={(newVal) =>
                            onUpdateLead(lead.id, { es_favorito: newVal })
                          }
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

                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-[var(--ink-2)] font-medium mt-1">
                      <span className="text-[var(--ink)] font-semibold">
                        {lead.ciudad || 'España'}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          lead.roster
                            ? 'text-[var(--acc)]/70 font-semibold'
                            : ''
                        }
                      >
                        {lead.roster
                          ? `Róster: ${lead.roster}`
                          : [
                                'agencia',
                                'manager',
                                'productora',
                                'sello',
                              ].includes(String(lead.tipo || '').toLowerCase())
                            ? 'Agencia / Booking'
                            : lead.aforo
                              ? `${lead.aforo} pax`
                              : 'Aforo n/d'}
                      </span>
                      <span>•</span>
                      <span className="text-[var(--ink-2)]">
                        {lead.genero || 'Variado'}
                      </span>
                    </div>

                    {/* Quality Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <LeadHealthBadge
                        lead={lead}
                        showDescription={true}
                        size="sm"
                      />
                      <ReliabilityBadge item={lead} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Direct Action Bar (WhatsApp, Call, Quick Pitch Approve, View) */}
                <div className="pt-2.5800/80 flex flex-wrap items-center justify-between gap-2 w-full mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Direct WhatsApp Button */}
                    {phoneClean ? (
                      <a
                        href={`https://wa.me/${phoneClean}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                        title="Enviar WhatsApp directo a la sala"
                      >
                        <MessageCircle className="w-4 h-4 text-[var(--ok)]" />
                        <span className="hidden xs:inline text-[11px]">
                          WhatsApp
                        </span>
                      </a>
                    ) : null}

                    {/* Direct Call Button */}
                    {lead.telefono ? (
                      <a
                        href={`tel:${lead.telefono}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--bg)]/80 hover:bg-[var(--tentative)] text-[var(--ink-3)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                        title="Llamar directamente por teléfono"
                      >
                        <PhoneCall className="w-4 h-4 text-[var(--ink-2)]" />
                        <span className="hidden xs:inline text-[11px]">
                          Llamar
                        </span>
                      </a>
                    ) : null}

                    {/* Direct Pitch Approval Button if pending */}
                    {(lead.estado === 'pendiente_aprobacion' ||
                      lead.estado === 'nuevo') && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickApprovePitch(e, lead)}
                        className="px-2.5 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[38px]"
                        title="Aprobar pitch directamente para envío"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--acc)]" />
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
                      className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 min-h-[38px] ${
                        isDetailOpen
                          ? 'bg-[var(--acc)] text-[var(--on-acc)]'
                          : 'bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--ink-3)]/60'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ficha</span>
                    </button>
                    {onDeleteLead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLead(lead.id, lead.nombre_sala);
                        }}
                        className="p-2 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] transition-all cursor-pointer min-h-[38px] flex items-center justify-center"
                        title="Eliminar y guardar en lista negra"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--alert)]" />
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
        <div className="overflow-x-auto rounded-[var(--r-l)] bg-[var(--surface)] pb-10">
          <table className="w-full text-left min-w-[980px]">
            <thead>
              <tr className="text-[10px] font-semibold tracking-wider text-[var(--ink-2)] bg-[var(--sunken)]">
                {/* Select All Checkbox Header */}
                {onToggleSelectLead && (
                  <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        ref={headerCheckboxRef}
                        checked={isAllSelected}
                        onChange={
                          isAllSelected ? onDeselectAll : onSelectAllFiltered
                        }
                        className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
                        title={
                          isAllSelected
                            ? 'Deseleccionar todos'
                            : 'Seleccionar todos los resultados'
                        }
                      />
                    </div>
                  </th>
                )}

                <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">
                  Fav
                </th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">
                  {sectionTab === 'medios'
                    ? 'Medio / Contacto'
                    : sectionTab === 'grupos'
                      ? 'Banda / Management'
                      : 'Espacio / Sala'}
                </th>
                <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">
                  Fiabilidad
                </th>
                <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">
                  Salud / Temp
                </th>
                <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">
                  Ciudad
                </th>
                <th className="py-3.5 px-4 min-w-[90px] whitespace-nowrap">
                  {sectionTab === 'grupos' ? 'Róster / Aforo' : 'Aforo'}
                </th>
                <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">
                  Estado
                </th>
                <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">
                  Contacto / Directo
                </th>
                <th className="py-3.5 px-4 min-w-[160px] text-right whitespace-nowrap">
                  Acciones Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)] text-xs align-middle">
              {filteredLeads.map((lead, idx) => {
                const isDetailOpen = selectedLead?.id === lead.id;
                const isChecked = selectedLeadIds.includes(lead.id);
                const phoneClean = cleanPhone(lead.telefono);
                const leadKey = lead.id
                  ? `lead-row-${lead.id}`
                  : `lead-row-${idx}`;

                return (
                  <tr
                    key={leadKey}
                    onClick={() => onSelectLead(lead)}
                    className={`transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[var(--acc-soft)]'
                        : isDetailOpen
                          ? 'bg-[var(--sunken)]'
                          : 'hover:bg-[var(--sunken)]'
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
                            className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
                            title={isChecked ? 'Deseleccionar' : 'Seleccionar'}
                          />
                        </div>
                      </td>
                    )}

                    <td
                      className="py-3.5 px-3 text-center align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FavoriteButton
                        isFavorite={!!lead.es_favorito}
                        onToggle={(newVal) =>
                          onUpdateLead(lead.id, { es_favorito: newVal })
                        }
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 min-w-[220px] align-middle">
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
                            <span
                              className="truncate font-bold text-xs sm:text-sm text-[var(--ink)] block max-w-[160px] notranslate"
                              translate="no"
                              title={lead.nombre_sala}
                            >
                              {lead.nombre_sala}
                            </span>
                            <VerifiedBadge
                              isVerified={isLeadVerificado(lead)}
                              size="sm"
                            />
                          </div>
                          <span className="text-[10px] text-[var(--ink-2)] font-sans font-normal truncate block">
                            {lead.genero || 'Sin género'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap align-middle">
                      <ReliabilityBadge item={lead} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap align-middle">
                      <LeadHealthBadge
                        lead={lead}
                        showDescription={false}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 min-w-[110px] text-[var(--ink-2)] align-middle">
                      <span className="font-semibold">
                        {lead.ciudad || 'España'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[90px] text-[var(--ink-2)] align-middle">
                      <span
                        className={
                          lead.roster
                            ? 'text-[var(--acc-ink)] font-semibold'
                            : 'text-[var(--ink)]'
                        }
                      >
                        {lead.roster
                          ? `Róster: ${lead.roster}`
                          : lead.aforo
                            ? `${lead.aforo} pax`
                            : 'n/d'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px] whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${getStatusBadgeClass(
                          lead.estado
                        )}`}
                      >
                        {getStatusLabel(lead.estado)}
                      </span>
                    </td>

                    {/* Direct Contact Column */}
                    <td className="py-3.5 px-4 min-w-[180px] align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {lead.email_contacto ? (
                            <>
                              {(() => {
                                const bounced = isBouncedLead(lead.notas);
                                const invalid =
                                  getEmailStatus(
                                    lead.id,
                                    lead.email_contacto,
                                    emailValidities
                                  ) === 'invalid';
                                const broken = bounced || invalid;
                                return (
                                  <>
                                    <a
                                      href={`mailto:${lead.email_contacto}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`font-normal truncate max-w-[140px] inline-block ${
                                        broken
                                          ? 'text-[var(--alert)] hover:brightness-110 line-through'
                                          : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                                      }`}
                                      title={lead.email_contacto}
                                    >
                                      {lead.email_contacto}
                                    </a>
                                    {broken && (
                                      <div
                                        title={
                                          bounced
                                            ? 'Email rebotado - el destinatario no existe'
                                            : 'Email inválido - no se puede contactar'
                                        }
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 text-[var(--alert)] flex-shrink-0" />
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-[var(--ink-2)] italic text-[11px]">
                              Sin email
                            </span>
                          )}
                        </div>
                        {phoneClean && (
                          <div className="flex items-center gap-1.5 text-[var(--ink-2)]">
                            <span>{lead.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Direct Quick Action Buttons in Table View */}
                    <td className="py-3.5 px-4 min-w-[160px] text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {phoneClean && (
                          <a
                            href={`https://wa.me/${phoneClean}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] rounded-[var(--r-s)] transition-colors inline-flex items-center"
                            title="WhatsApp directo"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                          </a>
                        )}

                        {lead.telefono && (
                          <a
                            href={`tel:${lead.telefono}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] rounded-[var(--r-s)] transition-colors inline-flex items-center"
                            title="Llamar teléfono"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                          </a>
                        )}

                        {(lead.estado === 'pendiente_aprobacion' ||
                          lead.estado === 'nuevo') && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprovePitch(e, lead)}
                            className="px-2 py-1 bg-[var(--ok-soft)] hover:brightness-95 text-[var(--ok)] rounded-[var(--r-s)] text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Aprobar pitch directamente"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                            <span>Aprobar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className={`p-1.5 rounded-[var(--r-s)] transition-colors inline-flex items-center ${
                            isDetailOpen
                              ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
                              : 'bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)]'
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
