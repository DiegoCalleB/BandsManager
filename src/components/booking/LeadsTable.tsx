import React, { useState } from 'react';
import { Lead, LeadStatus } from '../../types';
import { LeadHealthBadge } from './LeadHealthBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReliabilityBadge } from '../common/ReliabilityBadge';
import { FavoriteButton } from '../common/FavoriteButton';
import { isLeadVerificado } from '../../utils/leadReliability';
import { MessageCircle, PhoneCall, CheckCircle2, Eye, Sparkles, Trash2, Camera } from 'lucide-react';
import { ChangeLeadImageModal } from './ChangeLeadImageModal';
import { LeadAvatar } from './LeadAvatar';

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
  setMediaTypeFilter
}) => {
  const filteredLeads = mediaTypeFilter === 'todos' || !setMediaTypeFilter
    ? leads
    : leads.filter(l => l.genero?.toLowerCase() === mediaTypeFilter);

  const [leadForImageChange, setLeadForImageChange] = useState<Lead | null>(null);
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
      <div className="p-8 text-center rounded-2xl bg-[#121110] border border-zinc-800/80 my-4">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
        <p className="text-zinc-300 font-bold text-sm">No se encontraron medios o espacios</p>
        <p className="text-zinc-500 text-xs mt-1">Prueba a cambiar los filtros o los términos de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {sectionTab === 'medios' && setMediaTypeFilter && (
        <div className="flex gap-2 mb-4">
          {['todos', 'televisión', 'radio', 'redes', 'managements'].map((type) => (
            <button
              key={type}
              onClick={() => setMediaTypeFilter(type as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
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
      {viewMode === 'grid' ? (
        <div className={`grid gap-4 pb-10 transition-all duration-300 ${
          selectedLead 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        }`}>
          {filteredLeads.map((lead) => {
            const isSelected = selectedLead?.id === lead.id;
            const phoneClean = cleanPhone(lead.telefono);

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isSelected
                    ? 'bg-[#1A1918] border-2 border-[#f2ca50] shadow-xl ring-1 ring-[#f2ca50]/30'
                    : 'bg-[#121110] border border-zinc-800/80 hover:bg-[#1A1918] hover:border-zinc-700 shadow-md'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start gap-3 min-w-0 w-full">
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
                        <h4 className="font-display font-bold text-base sm:text-lg tracking-wide text-zinc-50 truncate">
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

                    {/* Quality Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <LeadHealthBadge lead={lead} showDescription={true} size="sm" />
                      <ReliabilityBadge item={lead} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Direct Action Bar (WhatsApp, Call, Quick Pitch Approve, View) */}
                <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 w-full mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Direct WhatsApp Button */}
                    {phoneClean ? (
                      <a
                        href={`https://wa.me/${phoneClean}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title="Enviar WhatsApp directo a la sala"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="hidden xs:inline text-[11px]">WhatsApp</span>
                      </a>
                    ) : null}

                    {/* Direct Call Button */}
                    {lead.telefono ? (
                      <a
                        href={`tel:${lead.telefono}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title="Llamar directamente por teléfono"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 min-h-[38px] ${
                        isSelected
                          ? 'bg-[#f2ca50] text-[#3c2f00] shadow-sm'
                          : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
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
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-black/40">
                <th className="py-3.5 px-3 w-10 text-center whitespace-nowrap">Fav</th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">
                  {sectionTab === 'medios' ? 'Medio / Contacto' : sectionTab === 'grupos' ? 'Banda / Management' : 'Espacio / Sala'}
                </th>
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
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const phoneClean = cleanPhone(lead.telefono);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#1A1918]' : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton 
                        isFavorite={!!lead.es_favorito}
                        onToggle={(newVal) => onUpdateLead(lead.id, { es_favorito: newVal })}
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
                            <span className="truncate font-bold text-xs sm:text-sm text-zinc-100 block max-w-[160px]" title={lead.nombre_sala}>
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

                    <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap align-middle">
                      <ReliabilityBadge item={lead} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 min-w-[120px] whitespace-nowrap align-middle">
                      <LeadHealthBadge lead={lead} showDescription={false} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 min-w-[110px] whitespace-nowrap align-middle text-zinc-300 font-semibold text-xs">
                      {lead.ciudad || '-'}
                    </td>

                    <td className="py-3.5 px-4 min-w-[90px] align-middle text-zinc-300 text-xs">
                      {lead.roster ? (
                        <span className="text-amber-300 font-semibold truncate max-w-[150px] block" title={lead.roster}>
                          🎸 {lead.roster}
                        </span>
                      ) : (
                        lead.aforo ? `${lead.aforo} pax` : (['agencia', 'manager', 'productora', 'sello'].includes(String(lead.tipo || '').toLowerCase()) ? 'Booking' : '-')
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px] whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium ${getStatusBadgeClass(
                          lead.estado
                        )}`}
                      >
                        {getStatusLabel(lead.estado)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[180px] align-middle text-zinc-400">
                      <div className="flex flex-col text-[11px] font-sans">
                        <span className="text-zinc-200 font-medium truncate max-w-[160px]" title={lead.email_contacto}>
                          {lead.email_contacto || 'Sin email'}
                        </span>
                        {lead.telefono && (
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {lead.telefono}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px] text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct WhatsApp */}
                        {phoneClean && (
                          <a
                            href={`https://wa.me/${phoneClean}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs"
                            title="WhatsApp directo"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        )}

                        {/* Direct Call */}
                        {lead.telefono && (
                          <a
                            href={`tel:${lead.telefono}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs"
                            title="Llamar por teléfono"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                          </a>
                        )}

                        {/* Direct Pitch Approval */}
                        {(lead.estado === 'pendiente_aprobacion' || lead.estado === 'nuevo') && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprovePitch(e, lead)}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                            title="Aprobar pitch"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            <span>Aprobar</span>
                          </button>
                        )}

                        {/* Open Ficha */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f2ca50] text-[#3c2f00]'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          Ver
                        </button>
                        {onDeleteLead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLead(lead.id, lead.nombre_sala);
                            }}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg transition-all cursor-pointer"
                            title="Eliminar y guardar en lista negra"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Image Change Modal */}
      <ChangeLeadImageModal
        lead={leadForImageChange}
        isOpen={!!leadForImageChange}
        onClose={() => setLeadForImageChange(null)}
        onUpdateLead={onUpdateLead}
        onLeadLogoUpload={onLeadLogoUpload}
      />
    </div>
  );
};
