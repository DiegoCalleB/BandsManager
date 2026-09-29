import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Smartphone,
  Calendar,
  Sparkles,
  Clock,
  BookOpen,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Lead } from '../../types';
import {
  cleanPhoneForWhatsApp,
  isLikelyMobile,
  isLikelyLandline,
  buildWhatsAppUrl,
  formatLeadPitchForWhatsApp,
  copyToClipboard,
} from '../../utils/whatsappUtils';
import { ModalPortal } from '../common/ModalPortal';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  bandName?: string;
  isStitchLight?: boolean;
  onLogInteraction?: (leadId: string, logData: { tipo: 'WhatsApp'; notas: string; resultado?: string }) => void;
  onUpdateLeadPhone?: (leadId: string, updates: { telefono_movil?: string; telefono_fijo?: string; telefono?: string }) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  lead,
  bandName = 'Nuestra Banda',
  isStitchLight = false,
  onLogInteraction,
  onUpdateLeadPhone,
}) => {
  // Inicialización de teléfono seleccionado (prioridad: telefono_movil -> telefono -> telefono_fijo)
  const initialPhone = lead.telefono_movil || lead.telefono || lead.telefono_fijo || '';
  const [targetPhone, setTargetPhone] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Mensaje
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [interactionLogged, setInteractionLogged] = useState(false);

  // Fechas libres disponibles del radar
  const detectedDates = lead.fechas_libres_detectadas || [];

  useEffect(() => {
    if (isOpen && lead) {
      const bestPhone = lead.telefono_movil || lead.telefono || lead.telefono_fijo || '';
      setTargetPhone(bestPhone);
      const initialMsg = formatLeadPitchForWhatsApp(lead, bandName, detectedDates);
      setMessage(initialMsg);
      setCopied(false);
      setInteractionLogged(false);
      setIsEditingPhone(false);
    }
  }, [isOpen, lead.id]);

  if (!isOpen) return null;

  const cleanPhone = cleanPhoneForWhatsApp(targetPhone);
  const hasValidPhone = cleanPhone.length >= 7;
  const isMobile = isLikelyMobile(targetPhone);
  const isLandline = isLikelyLandline(targetPhone);

  const waLink = hasValidPhone ? buildWhatsAppUrl(targetPhone, message) : '';

  const handleCopy = async () => {
    const ok = await copyToClipboard(message);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!waLink) return;

    // Auto-registrar en bitácora si no se ha hecho
    if (onLogInteraction && !interactionLogged) {
      onLogInteraction(lead.id, {
        tipo: 'WhatsApp',
        notas: `Mensaje directo abierto por WhatsApp para ${lead.contacto_nombre || lead.nombre_sala} (${targetPhone}). Texto:\n"${message.slice(0, 140)}..."`,
        resultado: 'Seguimiento pendiente',
      });
      setInteractionLogged(true);
    }

    // Abrir wa.me
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  const handleSavePhone = () => {
    if (onUpdateLeadPhone && targetPhone.trim()) {
      if (isMobile) {
        onUpdateLeadPhone(lead.id, {
          telefono_movil: targetPhone.trim(),
          telefono: targetPhone.trim(),
        });
      } else {
        onUpdateLeadPhone(lead.id, {
          telefono_fijo: targetPhone.trim(),
          telefono: lead.telefono_movil || targetPhone.trim(),
        });
      }
    }
    setIsEditingPhone(false);
  };

  const insertDateInMessage = (dateStr: string) => {
    const addition = ` ¿Tendríais disponible el ${dateStr}?`;
    if (!message.includes(dateStr)) {
      setMessage((prev) => `${prev.trim()}\n${addition}`);
    }
  };

  const resetMessage = () => {
    setMessage(formatLeadPitchForWhatsApp(lead, bandName, detectedDates));
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-2xl rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col my-auto border transition-all ${
            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[var(--ok)]/40 border-b border-[var(--ok)]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--ok)]/20 border border-[var(--hair)] flex items-center justify-center text-[var(--ok)]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold font-display tracking-tight text-[var(--ink)] flex items-center gap-1.5">
                    <span>Mensaje Directo por WhatsApp</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--hair)]">
                    wa.me 1-Clic
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)]">
                  {lead.nombre_sala} {lead.ciudad ? `(${lead.ciudad})` : ''} · {lead.contacto_nombre || 'Programación'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1.5 rounded-[var(--r-m)] hover:bg-[var(--surface)]/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Teléfono Destinatario */}
            <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/70 border border-[var(--hair)] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-2)] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>Destinatario WhatsApp:</span>
                </span>

                <div className="flex items-center gap-2">
                  {isMobile && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--hair)] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Móvil Detectado
                    </span>
                  )}
                  {isLandline && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--hair)] flex items-center gap-1"
                      title="Parece un teléfono fijo; puede no tener WhatsApp habilitado"
                    >
                      <AlertTriangle className="w-3 h-3" /> Posible Fijo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(!isEditingPhone)}
                    className="text-[10px] font-bold text-[var(--ok)] hover:underline cursor-pointer"
                  >
                    {isEditingPhone ? 'Cancelar edición' : 'Cambiar número'}
                  </button>
                </div>
              </div>

              {/* Selector / Editor de teléfono */}
              {isEditingPhone ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="tel"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="Ej. +34 612 345 678"
                    className="flex-1 bg-[var(--sunken)] border border-[var(--hair)] rounded-[var(--r-m)] px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ok)] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    className="px-3 py-1.5 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] rounded-[var(--r-m)] font-bold text-xs cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[var(--sunken)] px-3 py-2 rounded-[var(--r-m)] border border-[var(--hair)]">
                  <div className="flex items-center gap-2 font-mono text-[var(--ink-2)] font-bold">
                    <span className="text-[var(--ok)]">{targetPhone || 'Sin teléfono asignado'}</span>
                    {hasValidPhone && <span className="text-[10px] font-normal text-[var(--ink-2)]">(wa.me/{cleanPhone})</span>}
                  </div>
                  {/* Selector rápido si tiene ambos teléfonos guardados */}
                  <div className="flex items-center gap-1.5">
                    {lead.telefono_movil && lead.telefono_movil !== targetPhone && (
                      <button
                        type="button"
                        onClick={() => setTargetPhone(lead.telefono_movil!)}
                        className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] cursor-pointer"
                      >
                        Usar Móvil ({lead.telefono_movil})
                      </button>
                    )}
                    {lead.telefono_fijo && lead.telefono_fijo !== targetPhone && (
                      <button
                        type="button"
                        onClick={() => setTargetPhone(lead.telefono_fijo!)}
                        className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] cursor-pointer"
                      >
                        Usar Fijo ({lead.telefono_fijo})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!hasValidPhone && (
                <p className="text-[11px] text-[var(--alert)] flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Introduce un teléfono con formato válido (mínimo 9 dígitos) para abrir WhatsApp.</span>
                </p>
              )}
            </div>

            {/* Chips de fechas libres detectadas por el radar de Wegow / Salas */}
            {detectedDates.length > 0 && (
              <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/10 border border-[var(--hair)] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--acc)] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Fechas libres detectadas por el Radar (haz clic para insertar):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedDates.map((dateStr) => (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => insertDateInMessage(dateStr)}
                      className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)] text-[10px] font-mono font-bold transition-all border border-[var(--hair)] cursor-pointer flex items-center gap-1"
                    >
                      <span>+ {dateStr}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor de Mensaje */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[var(--ink-2)]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-2)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>Mensaje redactado para WhatsApp:</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetMessage}
                    className="text-[10px] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                    title="Restaurar propuesta inicial"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar
                  </button>
                  <span className="text-[10px] text-[var(--ink-2)] font-mono">
                    {message.length} caracteres · {message.split(/\s+/).filter(Boolean).length} palabras
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={9}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Redacta el mensaje para el programador..."
                  className="w-full bg-[var(--surface)] p-3.5 rounded-[var(--r-m)] border border-[var(--hair)] text-[var(--ink-2)] text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[var(--ok)] resize-y font-sans selection:bg-[var(--ok)]/30"
                />
              </div>
            </div>

            {/* Ventajas & Info de Privacidad */}
            <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)]/40 border border-[var(--hair)]/80 text-[11px] text-[var(--ink-2)] space-y-1">
              <p className="flex items-center gap-1.5 text-[var(--ink-2)] font-semibold">
                <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>100% gratuito y seguro: No requiere APIs ni suscripciones de Meta.</span>
              </p>
              <p className="pl-5 text-[var(--ink-2)]">
                Al pulsar en <strong>Abrir en WhatsApp</strong>, se abrirá tu WhatsApp Web o la App oficial con el chat del programador y el
                texto listo para enviar.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-[var(--surface)]/80 border-t border-[var(--hair)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-[var(--hair)]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span className="text-[var(--ok)]">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              {onLogInteraction && (
                <button
                  type="button"
                  onClick={() => {
                    onLogInteraction(lead.id, {
                      tipo: 'WhatsApp',
                      notas: `Registro manual de WhatsApp para ${lead.contacto_nombre || lead.nombre_sala} (${targetPhone}):\n"${message.slice(0, 140)}..."`,
                      resultado: 'Seguimiento pendiente',
                    });
                    setInteractionLogged(true);
                  }}
                  disabled={interactionLogged}
                  className={`px-3 py-2 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    interactionLogged
                      ? 'bg-[var(--ok)]/60 text-[var(--ok)] border-[var(--ok)]/30 opacity-80'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] border-[var(--hair)]'
                  }`}
                  title="Guarda la interacción en la bitácora del lead"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>{interactionLogged ? 'En Bitácora ✓' : 'Anotar en Bitácora'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={!hasValidPhone}
                className={`px-4 py-2 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  hasValidPhone
                    ? 'bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] font-extrabold shadow-[var(--ok)]/20'
                    : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)] cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Abrir en WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
