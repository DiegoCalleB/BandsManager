import React, { useState } from "react";
import { FileText, Copy, Check, X } from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Button, IconButton } from '../ui';
import { EMAIL_TEMPLATES } from './emailTemplates';

interface EmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
}

export const EmailTemplatesModal: React.FC<EmailTemplatesModalProps> = ({
  isOpen,
  onClose,
  bandName = "Tu Banda",
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("sala_directa");

  if (!isOpen) return null;

  const currentTpl =
    EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate) ||
    EMAIL_TEMPLATES[0];

  const handleCopy = (id: string, text: string) => {
    const formatted = text.replace(/{bandName}/g, bandName);
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-3xl my-auto max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="p-5 bg-[var(--sunken)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--ink)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-[var(--ink)] flex items-center gap-2">
                  Plantillas y ejemplos reales de email
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Modelos de redacción probados para salas, festivales, medios e
                  intercambios
                </p>
              </div>
            </div>

            <IconButton
              label="Cerrar"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Template Selection Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {EMAIL_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                const IconComp = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                        : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComp className="w-4 h-4 shrink-0 text-[var(--acc)]" />
                      <span
                        className={`text-micro font-sans font-bold px-1.5 py-0.5 rounded ${tpl.badgeColor}`}
                      >
                        {tpl.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-sans line-clamp-1">
                      {tpl.title.split(".")[1] || tpl.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Template Display Box */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3">
                <div>
                  <span className="text-micro font-sans text-[var(--acc)] font-bold">
                    {currentTpl.type}
                  </span>
                  <h4 className="text-sm font-bold font-display text-[var(--ink)]">
                    {currentTpl.title}
                  </h4>
                </div>

                <Button
                  variant="primary"
                  size="xs"
                  onClick={() =>
                    handleCopy(
                      currentTpl.id,
                      `Asunto: ${currentTpl.subject}\n\n${currentTpl.body}`,
                    )
                  }
                  className="items-center gap-1.5 shrink-0"
                >
                  {copiedId === currentTpl.id ? (
                    <>
                      <Check className="w-4 h-4 text-[var(--ok)]" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar plantilla</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Subject preview */}
              <div className="space-y-1">
                <span className="text-micro font-sans text-[var(--ink-2)]">
                  Asunto del Correo:
                </span>
                <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] text-xs font-sans font-bold text-[var(--acc)]/70">
                  {currentTpl.subject.replace(/{bandName}/g, bandName)}
                </div>
              </div>

              {/* Body preview */}
              <div className="space-y-1">
                <span className="text-micro font-sans text-[var(--ink-2)]">
                  Cuerpo del Mensaje:
                </span>
                <pre className="p-4 rounded-[var(--r-s)] bg-[var(--surface)]/90 text-xs font-sans text-[var(--ink-2)] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {currentTpl.body.replace(/{bandName}/g, bandName)}
                </pre>
              </div>
            </div>

            <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs flex items-center gap-2">
              <span>
                <strong>Consejo de Agentes AI:</strong> El Agente Redactor
                utiliza este mismo estilo directo y conciso al generar
                propuestas desde el panel de Booking.
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[var(--sunken)] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink)] font-sans text-xs font-bold hover:bg-[var(--surface)]/70 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
