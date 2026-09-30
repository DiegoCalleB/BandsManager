import React from "react";
import {
  Sparkles,
  Mail,
  ShieldCheck,
  Check,
  Send,
  Bot,
  Lock,
} from "lucide-react";
import { Input } from '../../ui';

interface StepAgentEmailProps {
  signatureName: string;
  setSignatureName: (v: string) => void;
  signatureCargo: string;
  setSignatureCargo: (v: string) => void;
  signaturePhone: string;
  setSignaturePhone: (v: string) => void;
  senderEmail: string;
  setSenderEmail: (v: string) => void;
}

export const StepAgentEmail: React.FC<StepAgentEmailProps> = ({
  signatureName,
  setSignatureName,
  signatureCargo,
  setSignatureCargo,
  signaturePhone,
  setSignaturePhone,
  senderEmail,
  setSenderEmail,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2">
        <Sparkles className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Agentes IA de Booking y conexión de correo
        </h3>
      </div>

      {/* Intro info box */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10  space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--acc)]" />
          <h4 className="text-xs font-semibold text-[var(--acc)]/70">
            Human-in-the-Loop: Automatización segura de Booking
          </h4>
        </div>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Tus agentes de IA descubren salas (Scout), redactan propuestas
          hiper-personalizadas (Redactor) y leen respuestas automáticamente.
          <strong className="text-[var(--ink)] font-medium">
            {" "}
            Ningún email se envía sin tu aprobación explícita previa
          </strong>
          .
        </p>
      </div>

      {/* Correo remitente & Firma profesional */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[var(--acc)]" />
            Email Oficial desde el que contactarás a las salas
          </label>
          <Input
            size="sm"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="contacto@tubanda.com o tubandaoficial@gmail.com"
            className="w-full"
          />
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Podrás conectar tu cuenta de Gmail con 1-clic o configurar IMAP/SMTP
            en Ajustes de Correo en cualquier momento.
          </p>
        </div>

        {/* Firma de correo del redactor */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
          <h4 className="text-xs font-semibold text-[var(--ink-2)]">
            Firma de correo para las propuestas
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                Nombre del remitente
              </label>
              <Input
                size="sm"
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Ej. Martín"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                Cargo / Rol
              </label>
              <Input
                size="sm"
                type="text"
                value={signatureCargo}
                onChange={(e) => setSignatureCargo(e.target.value)}
                placeholder="Ej. Cantante y Booking"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                Teléfono en la firma
              </label>
              <Input
                size="sm"
                type="tel"
                value={signaturePhone}
                onChange={(e) => setSignaturePhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
