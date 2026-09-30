import React, { useState } from 'react';
import { X, MessageSquare, Share2, Copy, Check, Mail, Phone, Edit3, Sparkles, Music, Calendar, Disc, FileText, Send } from 'lucide-react';
import { ThemeColors } from '../types';
import { shareViaWhatsApp, shareViaWebShare, copyToClipboard, shareViaEmail, SharePayload } from '../utils/shareUtils';
import { ModalPortal } from './common/ModalPortal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialText: string;
  itemType?: 'song' | 'idea' | 'setlist' | 'rehearsal' | 'concert' | 'pitch' | 'epk' | 'custom';
  defaultPhone?: string;
  colors?: ThemeColors;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  initialText,
  itemType = 'custom',
  defaultPhone = '',
  colors,
}: ShareModalProps) {
  const [text, setText] = useState<string>(initialText);
  const [phone, setPhone] = useState<string>(defaultPhone);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Sync state if initialText changes while modal opens
  React.useEffect(() => {
    setText(initialText);
    setCopied(false);
  }, [initialText]);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    shareViaWhatsApp(text, phone);
  };

  const handleWebShare = async () => {
    const success = await shareViaWebShare({
      title,
      text,
    });
    if (!success) {
      // Fallback to clipboard if native share was closed or not supported
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEmail = () => {
    shareViaEmail(title, text);
  };

  const getItemIcon = () => {
    switch (itemType) {
      case 'song':
        return <Music className="w-5 h-5 text-[var(--tentative)]" />;
      case 'idea':
        return <Sparkles className="w-5 h-5 text-[var(--acc)]" />;
      case 'setlist':
        return <Disc className="w-5 h-5 text-[var(--acc)]" />;
      case 'rehearsal':
      case 'concert':
        return <Calendar className="w-5 h-5 text-[var(--ok)]" />;
      case 'pitch':
      case 'epk':
        return <FileText className="w-5 h-5 text-[var(--ink-2)]" />;
      default:
        return <Share2 className="w-5 h-5 text-[var(--acc)]" />;
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--scrim)]/75 p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className="w-full max-w-xl rounded-[var(--r-l)] bg-[var(--surface)] overflow-hidden flex flex-col my-auto max-h-[92vh] text-[var(--ink)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[var(--surface)]/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ink)]/5 flex items-center justify-center">{getItemIcon()}</div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">Compartir {title}</h3>
                {subtitle && <p className="text-xs text-[var(--ink-2)]">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/10 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {/* Quick Action Buttons Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-[var(--r-m)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] font-semibold text-xs transition-ui active:scale-[0.97]"
              >
                <MessageSquare className="w-4 h-4 fill-[var(--surface)]/20" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleWebShare}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-[var(--r-m)] bg-[var(--tentative)] hover:bg-[var(--acc)] text-[var(--ink)] font-semibold text-xs transition-ui active:scale-[0.97]"
              >
                <Share2 className="w-4 h-4" />
                <span>Otras Apps</span>
              </button>

              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-[var(--r-m)] font-semibold text-xs transition-ui active:scale-[0.97] ${
                  copied ? 'bg-[var(--accent-alt)] text-[var(--ink)]' : 'bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)]'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleEmail}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-[var(--r-m)] bg-[var(--tentative)]/80 hover:bg-[var(--tentative)] text-[var(--ink)] font-semibold text-xs transition-ui active:scale-[0.97]"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
            </div>

            {/* Optional Phone Number input for WhatsApp direct */}
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)]/[0.03] space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-2)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--ok)]" />
                  Número de WhatsApp (Opcional)
                </span>
                <span className="text-micro text-[var(--ink-2)]">Déjalo en blanco para elegir contacto en la app</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +34612345678 o 612345678"
                className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-xs text-[var(--ink)] placeholder-[var(--ink-2)] focus:outline-none transition-colors"
              />
            </div>

            {/* Text Preview & Edit Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-2)] flex items-center gap-1.5">Vista previa del mensaje</span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-[var(--acc)] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditing ? 'Ver formato final' : 'Editar texto antes de enviar'}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="w-full p-3 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs font-sans text-[var(--ink)] focus:outline-none leading-relaxed custom-scrollbar"
                />
              ) : (
                <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--bg)]/90 text-xs text-[var(--ink-2)] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans custom-scrollbar select-text">
                  {text}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[var(--surface)]/[0.02] flex items-center justify-between">
            <span className="text-xs text-[var(--ink-2)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--acc)]" />
              Listos para WhatsApp, Telegram, Signal o Email
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWhatsApp}
                className="px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar a WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
