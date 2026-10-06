// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React, { useRef } from 'react';
import { Heart, DollarSign, Upload, FileText, CheckCircle2, Loader2, Trash2, Smartphone, CreditCard, Sparkles } from 'lucide-react';

interface StepFansPaymentsProps {
  fanCallToAction: string;
  setFanCallToAction: (v: string) => void;
  fanWelcomeMessage: string;
  setFanWelcomeMessage: (v: string) => void;
  fanRewardDescription: string;
  setFanRewardDescription: (v: string) => void;
  fanRewardLink: string;
  setFanRewardLink: (v: string) => void;
  leadMagnetFileName: string;
  setLeadMagnetFileName: (v: string) => void;
  isUploadingLeadMagnet: boolean;
  onLeadMagnetUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  discountCode: string;
  setDiscountCode: (v: string) => void;
  bizumNumber: string;
  setBizumNumber: (v: string) => void;
  revolutTag: string;
  setRevolutTag: (v: string) => void;
  paypalEmail: string;
  setPaypalEmail: (v: string) => void;
  ibanNumber: string;
  setIbanNumber: (v: string) => void;
}

export const StepFansPayments: React.FC<StepFansPaymentsProps> = ({
  fanCallToAction,
  setFanCallToAction,
  fanWelcomeMessage,
  setFanWelcomeMessage,
  fanRewardDescription,
  setFanRewardDescription,
  fanRewardLink,
  setFanRewardLink,
  leadMagnetFileName,
  setLeadMagnetFileName,
  isUploadingLeadMagnet,
  onLeadMagnetUpload,
  discountCode,
  setDiscountCode,
  bizumNumber,
  setBizumNumber,
  revolutTag,
  setRevolutTag,
  paypalEmail,
  setPaypalEmail,
  ibanNumber,
  setIbanNumber,
}) => {
  const leadMagnetInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <Heart className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-semibold text-white">Captación de Fans, Regalo Descargable & Pagos Directos</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Configura tu landing page pública de fans. Coloca el código QR en tus conciertos para captar emails, regalar contenido exclusivo y recibir propinas o pagos por Bizum y Revolut.
      </p>

      {/* Mensajes QR para Fans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Gancho / Titular en el QR de Concierto
          </label>
          <input
            type="text"
            value={fanCallToAction}
            onChange={(e) => setFanCallToAction(e.target.value)}
            placeholder="Ej. ¡Únete al club y descarga nuestra maqueta inédita!"
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Mensaje de Bienvenida para nuevos Fans
          </label>
          <input
            type="text"
            value={fanWelcomeMessage}
            onChange={(e) => setFanWelcomeMessage(e.target.value)}
            placeholder="Ej. ¡Gracias por apoyarnos en directo! Aquí tienes tu regalo."
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Regalo / Lead Magnet Directo */}
      <div className="p-4 rounded-xl bg-[#19191d] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Regalo para el Fan (Lead Magnet / Descarga Inmediata)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Descripción del Regalo
            </label>
            <input
              type="text"
              value={fanRewardDescription}
              onChange={(e) => setFanRewardDescription(e.target.value)}
              placeholder="Ej. Canción acústica inédita en MP3 + Libreto PDF"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Código de Descuento en Merch (Opcional)
            </label>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Ej. DIRECTO10"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 uppercase"
            />
          </div>
        </div>

        {/* Subida del archivo de regalo */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Archivo descargable de regalo (MP3, WAV, PDF, ZIP)
          </label>
          <input
            type="file"
            ref={leadMagnetInputRef}
            onChange={onLeadMagnetUpload}
            accept="audio/*,.pdf,.zip,image/*"
            className="hidden"
          />

          {fanRewardLink ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-medium text-emerald-300 truncate max-w-sm">
                  {leadMagnetFileName || 'Archivo_de_Regalo.mp3'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => leadMagnetInputRef.current?.click()}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => { setFanRewardLink(''); setLeadMagnetFileName(''); }}
                  className="p-1 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => leadMagnetInputRef.current?.click()}
                disabled={isUploadingLeadMagnet}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
              >
                {isUploadingLeadMagnet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Subir Archivo de Regalo
              </button>
              <input
                type="text"
                value={fanRewardLink}
                onChange={(e) => setFanRewardLink(e.target.value)}
                placeholder="O pega un enlace de descarga externo (Dropbox, Drive, Mega...)"
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Métodos de Pago y Propinas Directas */}
      <div className="pt-2 border-t border-white/5 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          Métodos de Pago & Propinas Directas (Sin Comisiones)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-cyan-400" /> Bizum (Teléfono)
            </label>
            <input
              type="text"
              value={bizumNumber}
              onChange={(e) => setBizumNumber(e.target.value)}
              placeholder="600 000 000"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-blue-400" /> Revolut (@Tag)
            </label>
            <input
              type="text"
              value={revolutTag}
              onChange={(e) => setRevolutTag(e.target.value)}
              placeholder="@tubandatag"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-indigo-400" /> PayPal (Email / Me)
            </label>
            <input
              type="text"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="paypal.me/tubanda"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-400" /> IBAN / Transferencia
            </label>
            <input
              type="text"
              value={ibanNumber}
              onChange={(e) => setIbanNumber(e.target.value)}
              placeholder="ES00 0000..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
