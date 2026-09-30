import React, { useState } from 'react';
import { BandContact } from '../../types';
import { Repeat, X, Check, Copy, MessageCircle, Send } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { openWhatsAppChat, getWhatsAppUrl, WHATSAPP_WINDOW_NAME } from '../../utils/whatsapp';
import { Input } from '../ui';

interface BandPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: BandContact | null;
  activeCampaign?: any;
  myBandName: string;
  proposedCity: string;
  setProposedCity: (val: string) => void;
  proposedVenue: string;
  setProposedVenue: (val: string) => void;
  proposedMonth: string;
  setProposedMonth: (val: string) => void;
  generatePitchText: (band: BandContact) => string;
  customPitchText?: string;
}

export const BandPitchModal: React.FC<BandPitchModalProps> = ({
  isOpen,
  onClose,
  band,
  activeCampaign,
  myBandName,
  proposedCity,
  setProposedCity,
  proposedVenue,
  setProposedVenue,
  proposedMonth,
  setProposedMonth,
  generatePitchText,
  customPitchText,
}) => {
  const [copiedPitch, setCopiedPitch] = useState(false);

  if (!isOpen || !band) return null;

  const pitchText = customPitchText || generatePitchText(band);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-2xl rounded-[var(--r-l)] p-6 space-y-5 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${'bg-[var(--surface)] text-[var(--ink)]'}`}
        >
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[var(--acc)]" />
              <h3 className="text-base font-bold font-display text-[var(--acc)]">
                Generador de pitch Date Swap: {myBandName} x {band.nombre_banda}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[var(--surface)]/80 rounded-[var(--r-pill)] transition-colors cursor-pointer">
              <X className="w-5 h-5 text-[var(--ink-2)]" />
            </button>
          </div>

          {/* Config Fields */}
          {!activeCampaign?.isActive && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-micro font-sans">
              <div>
                <label className="block text-micro text-[var(--ink-2)] mb-1">Ciudad donde os recibís</label>
                <Input size="sm" aria-label="Ciudad donde os recibís"
                  type="text"
                  value={proposedCity}
                  placeholder="Madrid"
                  onChange={(e) => setProposedCity(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-micro text-[var(--ink-2)] mb-1">Sala propuesta</label>
                <Input size="sm" aria-label="Sala propuesta"
                  type="text"
                  value={proposedVenue}
                  placeholder="Nombre de la sala"
                  onChange={(e) => setProposedVenue(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-micro text-[var(--ink-2)] mb-1">Periodo / mes estimado</label>
                <Input size="sm" aria-label="Periodo / mes estimado"
                  type="text"
                  value={proposedMonth}
                  onChange={(e) => setProposedMonth(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Generated Pitch Preview Box */}
          <div className="space-y-1.5">
            <label className="block text-micro font-sans text-[var(--acc)] flex items-center justify-between">
              <span>Mensaje de propuesta generado (Músico a músico)</span>
              <span className="text-micro text-[var(--ink-2)] lowercase">editable y listo para enviar</span>
            </label>

            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] text-micro font-sans text-[var(--ink-2)] whitespace-pre-wrap leading-relaxed select-text max-h-72 overflow-y-auto">
              {pitchText}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-micro font-sans text-[var(--ink-2)]">
              Destinatario: <strong className="text-[var(--ink)]">{band.contacto_nombre || band.nombre_banda}</strong>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy to Clipboard */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pitchText);
                  setCopiedPitch(true);
                  setTimeout(() => setCopiedPitch(false), 2000);
                }}
                className="px-2 py-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] rounded-[var(--r-pill)] font-sans text-micro transition-ui cursor-pointer flex items-center gap-1.5"
              >
                {copiedPitch ? <Check className="w-4 h-4 text-[var(--ok)]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPitch ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              {/* WhatsApp Link if phone is present */}
              {band.telefono && (
                <a
                  href={getWhatsAppUrl(band.telefono, pitchText)}
                  target={WHATSAPP_WINDOW_NAME}
                  onClick={(e) => {
                    e.preventDefault();
                    openWhatsAppChat(band.telefono, pitchText);
                  }}
                  className="px-2 py-1 bg-[var(--surface)]/15 hover:bg-[var(--surface)]/15 text-[var(--ink)] font-sans text-micro font-bold rounded-[var(--r-m)] transition-ui cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </a>
              )}

              {/* Mailto Link if email is present */}
              {band.email && (
                <a
                  href={`mailto:${band.email}?subject=${encodeURIComponent(`Propuesta Date Swap: ${myBandName} x ${band.nombre_banda}`)}&body=${encodeURIComponent(pitchText)}`}
                  className="px-2 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/15 text-[var(--ink)] font-sans text-micro font-bold rounded-[var(--r-m)] transition-ui cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
