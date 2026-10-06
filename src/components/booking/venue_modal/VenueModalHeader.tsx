import { PopoverAncla } from '../../ui/PopoverAncla';
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { Lead, LeadStatus, LeadType } from '../../../types';
import { LeadAvatar } from '../LeadAvatar';
import { VerifiedBadge } from '../../common/VerifiedBadge';
import { LeadHealthBadge } from '../LeadHealthBadge';
import { isLeadVerificado } from '../../../utils/leadReliability';
import { FavoriteButton } from '../../common/FavoriteButton';
import { Button, IconButton, Input } from '../../ui';
import { ShowIcon } from '../../ui/ShowIcon';

interface VenueModalHeaderProps {
  lead: Lead;
  leads: Lead[];
  currentIndex: number;
  totalCount: number;
  onPrevLead: () => void;
  onNextLead: () => void;
  onSelectLead: (lead: Lead) => void;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
}

export const VenueModalHeader: React.FC<VenueModalHeaderProps> = ({
  lead,
  leads,
  currentIndex,
  totalCount,
  onPrevLead,
  onNextLead,
  onSelectLead,
  onClose,
  onUpdateLead,
  onDeleteLead,
  getStatusDotColor,
  normalizeStatus,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredLeads = searchQuery.trim()
    ? leads.filter((l) =>
        l.nombre_sala.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.ciudad && l.ciudad.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : leads.slice(0, 12);

  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[var(--surface)] border-b border-[var(--hair)] shrink-0 select-none">
      {/* 1. LEFT: AVATAR & BASIC IDENTIFIER */}
      <div className="flex items-center gap-3 min-w-0">
        <LeadAvatar lead={lead} size="md" showCameraHover={false} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className="text-base sm:text-lg font-bold font-display tracking-tight text-[var(--ink)] truncate notranslate"
              translate="no"
              title={lead.nombre_sala}
            >
              {lead.nombre_sala}
            </h2>
            <VerifiedBadge isVerified={isLeadVerificado(lead)} size="sm" showLabel={false} />
            <FavoriteButton
              isFavorite={!!lead.es_favorito}
              onToggle={(newVal) => onUpdateLead(lead.id, { es_favorito: newVal })}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)] truncate">
            <span className="font-semibold">{lead.ciudad || 'Sin ciudad'}</span>
            <span>•</span>
            <span className="truncate">{lead.genero || 'Variado'}</span>
            {lead.aforo ? (
              <>
                <span>•</span>
                <span className="font-mono text-[var(--acc)] font-bold">{lead.aforo} pax</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* 2. CENTER: STATUS SELECTOR & QUICK SEARCH */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2.5 py-1 rounded-[var(--r-m)] border border-[var(--hair)]">
          <span className={`w-2 h-2 rounded-[var(--r-pill)] shrink-0 ${getStatusDotColor(lead.estado)}`} />
          <select
            data-raw
            value={normalizeStatus(lead.estado)}
            onChange={(e) => onUpdateLead(lead.id, { estado: e.target.value as LeadStatus })}
            className="text-xs font-sans font-bold text-[var(--ink)] bg-transparent cursor-pointer focus:outline-none"
            title="Cambiar estado en el embudo"
          >
            <option value="nuevo">Por contactar (nuevo)</option>
            <option value="esperando_respuesta">Contactado (esperando respuesta)</option>
            <option value="respondido">En conversación (ha respondido)</option>
            <option value="negociando">En negociación</option>
            <option value="confirmado">Concierto confirmado</option>
            <option value="aplazado">Aplazado</option>
            <option value="no_interesado">Descartado</option>
          </select>
        </div>

        {/* Quick Venue Switcher Dropdown */}
        <div ref={searchContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] text-xs font-sans font-medium bg-[var(--sunken)] hover:bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--hair)] transition-colors cursor-pointer"
            title="Saltar a otra sala sin salir del modal"
          >
            <Search className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Cambiar sala...</span>
          </button>

          {isSearchOpen && (
            <PopoverAncla izquierda className="absolute left-0 top-full mt-1.5 w-72 bg-[var(--surface)] rounded-[var(--r-l)] shadow-xl border border-[var(--hair)] z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--ink-2)]" />
                <Input
                  ref={searchInputRef}
                  size="sm"
                  placeholder="Escribe el nombre o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 text-xs"
                />
              </div>

              <div className="max-h-56 overflow-y-auto no-scrollbar space-y-0.5 pt-1">
                {filteredLeads.length === 0 ? (
                  <p className="text-xs text-[var(--ink-2)] p-2 text-center">No se encontraron salas</p>
                ) : (
                  filteredLeads.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onSelectLead(l);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left p-1.5 px-2 rounded-[var(--r-s)] text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        l.id === lead.id
                          ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold'
                          : 'hover:bg-[var(--sunken)] text-[var(--ink)]'
                      }`}
                    >
                      <span className="truncate">{l.nombre_sala}</span>
                      <span className="text-micro opacity-70 shrink-0">{l.ciudad || ''}</span>
                    </button>
                  ))
                )}
              </div>
            </PopoverAncla>
          )}
        </div>
      </div>

      {/* 3. RIGHT: NEXT / PREV BUTTONS & CLOSE */}
      <div className="flex items-center gap-1.5 shrink-0">
        {totalCount > 1 && (
          <div className="flex items-center gap-1 bg-[var(--sunken)] px-1.5 py-0.5 rounded-[var(--r-m)] border border-[var(--hair)]">
            <IconButton
              label="Sala anterior (Flecha izquierda)"
              size="icon-xs"
              onClick={onPrevLead}
              disabled={currentIndex <= 0}
              className="disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </IconButton>

            <span className="text-micro font-mono text-[var(--ink-2)] px-1 tabular-nums">
              {currentIndex + 1} / {totalCount}
            </span>

            <IconButton
              label="Siguiente sala (Flecha derecha)"
              size="icon-xs"
              onClick={onNextLead}
              disabled={currentIndex >= totalCount - 1}
              className="disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </IconButton>
          </div>
        )}

        {onDeleteLead && (
          <IconButton
            label="Eliminar sala"
            size="icon-xs"
            onClick={() => onDeleteLead(lead.id, lead.nombre_sala)}
            className="text-[var(--alert)] hover:bg-[var(--alert)]/10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        )}

        <IconButton
          label="Cerrar modal (Esc)"
          size="icon-sm"
          onClick={onClose}
          className="hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
};
