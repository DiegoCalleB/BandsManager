import React, { useRef } from 'react';
import { Heart, DollarSign, Upload, FileText, CheckCircle2, Loader2, Trash2, Smartphone, CreditCard } from 'lucide-react';
import { Button, IconButton, Input, LinkButton } from '../../ui';

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
      <div className="flex items-center gap-2 pb-2">
        <Heart className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">Captación de fans, regalo descargable y pagos directos</h3>
      </div>

      <p className="text-xs text-[var(--ink-2)]">
        Configura tu landing page pública de fans. Coloca el código QR en tus conciertos para captar emails, regalar contenido exclusivo y
        recibir propinas o pagos por Bizum y Revolut.
      </p>

      {/* Mensajes QR para Fans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">Gancho / titular en el QR de concierto</label>
          <Input
            size="sm"
            type="text"
            value={fanCallToAction}
            onChange={(e) => setFanCallToAction(e.target.value)}
            placeholder="Ej. ¡Únete al club y descarga nuestra maqueta inédita!"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">Mensaje de bienvenida para nuevos fans</label>
          <Input
            size="sm"
            type="text"
            value={fanWelcomeMessage}
            onChange={(e) => setFanWelcomeMessage(e.target.value)}
            placeholder="Ej. ¡Gracias por apoyarnos en directo! Aquí tienes tu regalo."
            className="w-full"
          />
        </div>
      </div>

      {/* Regalo / Lead Magnet Directo */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[var(--acc)]/70 flex items-center gap-1.5">
            Regalo para el fan (lead magnet / descarga inmediata)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">Descripción del regalo</label>
            <Input
              size="sm"
              type="text"
              value={fanRewardDescription}
              onChange={(e) => setFanRewardDescription(e.target.value)}
              placeholder="Ej. Canción acústica inédita en MP3 + Libreto PDF"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">Código de descuento en Merch (opcional)</label>
            <Input
              size="sm"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Ej. DIRECTO10"
              className="w-full"
            />
          </div>
        </div>

        {/* Subida del archivo de regalo */}
        <div className="pt-2 space-y-2">
          <label className="block text-xs font-medium text-[var(--ink-2)]">Archivo descargable de regalo (MP3, WAV, PDF, ZIP)</label>
          <input aria-label="Archivo descargable de regalo (MP3, WAV, PDF, ZIP)" type="file" ref={leadMagnetInputRef} onChange={onLeadMagnetUpload} accept="audio/*,.pdf,.zip,image/*" className="hidden" />

          {fanRewardLink ? (
            <div className="flex items-center justify-between p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)] flex-shrink-0" />
                <span className="text-xs font-medium text-[var(--ink-2)] truncate max-w-sm">
                  {leadMagnetFileName || 'Archivo_de_Regalo.mp3'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LinkButton
                  tone="muted"
                  type="button"
                  onClick={() => leadMagnetInputRef.current?.click()}
                >
                  Cambiar
                </LinkButton>
                <IconButton
                  label="Eliminar"
                  variant="danger"
                  size="icon-xs"
                  type="button"
                  onClick={() => {
                    setFanRewardLink('');
                    setLeadMagnetFileName('');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="soft"
                size="sm"
                type="button"
                onClick={() => leadMagnetInputRef.current?.click()}
                disabled={isUploadingLeadMagnet}
                className="items-center gap-1.5"
              >
                {isUploadingLeadMagnet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Subir archivo de regalo
              </Button>
              <Input
                size="sm"
                type="text"
                value={fanRewardLink}
                onChange={(e) => setFanRewardLink(e.target.value)}
                placeholder="O pega un enlace de descarga externo (Dropbox, Drive, Mega…)"
                className="flex-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Métodos de Pago y Propinas Directas */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-[var(--acc)]" />
          Métodos de pago y propinas directas (sin comisiones)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-[var(--acc)]" /> Bizum (Teléfono)
            </label>
            <Input
              size="sm"
              type="text"
              value={bizumNumber}
              onChange={(e) => setBizumNumber(e.target.value)}
              placeholder="600 000 000"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-[var(--acc)]" /> Revolut (@Tag)
            </label>
            <Input
              size="sm"
              type="text"
              value={revolutTag}
              onChange={(e) => setRevolutTag(e.target.value)}
              placeholder="@tubandatag"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[var(--tentative)]" /> PayPal (Email / Me)
            </label>
            <Input
              size="sm"
              type="text"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="paypal.me/tubanda"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-[var(--ok)]" /> IBAN / Transferencia
            </label>
            <Input
              size="sm"
              type="text"
              value={ibanNumber}
              onChange={(e) => setIbanNumber(e.target.value)}
              placeholder="ES00 0000…"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
