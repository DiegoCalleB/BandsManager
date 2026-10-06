import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Mail, Compass, History, Building2, Zap } from 'lucide-react';
import { Lead, LeadStatus, Concert } from '../../../types';
import { ModalPortal } from '../../common/ModalPortal';
import { VenueModalHeader } from './VenueModalHeader';
import { VenueProfileColumn } from './VenueProfileColumn';
import { VenuePitchWorkspace } from './VenuePitchWorkspace';
import { VenueEmailThread } from './VenueEmailThread';
import { VenueIntelligenceTab } from './VenueIntelligenceTab';
import { VenueBitacoraTab } from './VenueBitacoraTab';
import { WhatsAppPreviewModal } from '../WhatsAppPreviewModal';
import { FastDealModal } from '../FastDealModal';
import { VenueModalTab, VenueModalProps } from './types';

export const VenueWorkspaceModal: React.FC<VenueModalProps> = ({
  isOpen,
  onClose,
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLead,
  onDeleteLead,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusDotColor,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  sectionTab,
  activeCampaign,
  onLeadLogoUpload,
  isUploadingLeadLogo,
  initialTab = 'pitch',
  onFilterByRouteCity,
  bandName,
  concerts = [],
}) => {
  const [activeTab, setActiveTab] = useState<VenueModalTab>(initialTab);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [mobileViewSection, setMobileViewSection] = useState<'profile' | 'action'>('action');

  // Sync initial tab when selectedLead changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [selectedLead?.id, initialTab]);

  // Current lead index within the active filtered leads list
  const currentIndex = selectedLead ? leads.findIndex((l) => l.id === selectedLead.id) : -1;

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectLead(leads[currentIndex - 1]);
    }
  }, [currentIndex, leads, onSelectLead]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < leads.length - 1) {
      onSelectLead(leads[currentIndex + 1]);
    }
  }, [currentIndex, leads, onSelectLead]);

  // Keyboard navigation: Escape to close, ArrowLeft & ArrowRight to navigate (if not typing in input/textarea)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        if (!isWhatsAppModalOpen) {
          onClose();
        }
      } else if (!isInput) {
        if (e.key === 'ArrowLeft') {
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose, isWhatsAppModalOpen]);

  if (!isOpen || !selectedLead) return null;

  const messagesCount = (selectedLead as any).mensajes?.length || (selectedLead as any).email_thread?.length || 0;
  const bitacoraCount = selectedLead.historial_contacto?.length || 0;

  return (
    <ModalPortal>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* MODAL WORKSPACE CONTAINER */}
        <div className="w-full max-w-6xl h-[94vh] max-h-[900px] bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-xl)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* 1. FIXED TOP HEADER WITH QUICK SWITCHER & NAV ARROWS */}
          <VenueModalHeader
            lead={selectedLead}
            leads={leads}
            currentIndex={currentIndex}
            totalCount={leads.length}
            onPrevLead={handlePrev}
            onNextLead={handleNext}
            onSelectLead={onSelectLead}
            onClose={onClose}
            onUpdateLead={onUpdateLead}
            onDeleteLead={onDeleteLead}
            getStatusDotColor={getStatusDotColor}
            normalizeStatus={normalizeStatus}
          />

          {/* MOBILE TOGGLE SWITCHER (Visible only on small screens) */}
          <div className="lg:hidden flex items-center border-b border-[var(--hair)] bg-[var(--sunken)]/60 p-1">
            <button
              type="button"
              onClick={() => setMobileViewSection('profile')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--r-s)] transition-colors cursor-pointer ${
                mobileViewSection === 'profile'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--ink-2)]'
              }`}
            >
              Ficha & Contacto
            </button>
            <button
              type="button"
              onClick={() => setMobileViewSection('action')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--r-s)] transition-colors cursor-pointer ${
                mobileViewSection === 'action'
                  ? 'bg-[var(--surface)] text-[var(--acc)] shadow-2xs'
                  : 'text-[var(--ink-2)]'
              }`}
            >
              Propuesta & Correos
            </button>
          </div>

          {/* 2. BODY WORKSPACE: 2 COLUMNS ON DESKTOP */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
            {/* LEFT COLUMN: VENUE PROFILE & EDIT FORM (~42% width) */}
            <div
              className={`lg:col-span-5 h-full overflow-hidden ${
                mobileViewSection === 'profile' ? 'block' : 'hidden lg:block'
              }`}
            >
              <VenueProfileColumn
                lead={selectedLead}
                onUpdateLead={onUpdateLead}
                onFilterByRouteCity={onFilterByRouteCity}
                bandName={bandName}
                concerts={concerts}
                onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
                autoDetectVenueAddress={autoDetectVenueAddress}
              />
            </div>

            {/* RIGHT COLUMN: THE CROWN JEWEL - ACTION & AI (~58% width) */}
            <div
              className={`lg:col-span-7 h-full flex flex-col overflow-hidden bg-[var(--surface)] ${
                mobileViewSection === 'action' ? 'block' : 'hidden lg:flex'
              }`}
            >
              {/* Navigation Tabs Bar */}
              <div className="flex items-center gap-1 px-4 sm:px-6 pt-2.5 pb-2 border-b border-[var(--hair)] bg-[var(--sunken)] shrink-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('pitch')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--r-m)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'pitch'
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Propuesta / Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('emails')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--r-m)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'emails'
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Correos</span>
                  {messagesCount > 0 && (
                    <span className="text-micro font-mono font-bold px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)]">
                      {messagesCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('intelligence')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--r-m)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'intelligence'
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Radar & P&L</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('bitacora')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--r-m)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'bitacora'
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Bitácora</span>
                  {bitacoraCount > 0 && (
                    <span className="text-micro font-mono font-semibold px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
                      {bitacoraCount}
                    </span>
                  )}
                </button>

                <div className="ml-auto pl-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsDealModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-m)] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    title="Generar Hoja de Acuerdo y Enlace 1-Click para la Sala"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Cerrar Bolo 1-Click</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Canvas */}
              <div className="flex-1 overflow-hidden min-h-0">
                {activeTab === 'pitch' && (
                  <VenuePitchWorkspace
                    lead={selectedLead}
                    onUpdateLead={onUpdateLead}
                    onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
                    activeCampaign={activeCampaign}
                    bandName={bandName}
                  />
                )}

                {activeTab === 'emails' && (
                  <VenueEmailThread
                    lead={selectedLead}
                    onUpdateLead={onUpdateLead}
                    onSelectPitchTab={() => setActiveTab('pitch')}
                    bandName={bandName}
                  />
                )}

                {activeTab === 'intelligence' && (
                  <VenueIntelligenceTab
                    lead={selectedLead}
                    onUpdateLead={onUpdateLead}
                    bandName={bandName}
                  />
                )}

                {activeTab === 'bitacora' && (
                  <VenueBitacoraTab
                    lead={selectedLead}
                    onUpdateLead={onUpdateLead}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP PREVIEW MODAL */}
      {isWhatsAppModalOpen && (
        <WhatsAppPreviewModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          lead={selectedLead}
          bandName={bandName}
        />
      )}

      {/* FAST DEAL 1-CLICK MODAL */}
      {isDealModalOpen && (
        <FastDealModal
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          lead={selectedLead}
          bandName={bandName}
          onDealConfirmed={() => {
            onUpdateLead(selectedLead.id, { estado: 'confirmado' });
          }}
        />
      )}
    </ModalPortal>
  );
};
