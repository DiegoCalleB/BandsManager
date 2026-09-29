import React from "react";
import { AlertCircle, ArrowRight, DollarSign, Mail } from "lucide-react";
import { Concert, Lead } from "../../types";

interface NeedsAttentionBannerProps {
  concerts?: Concert[];
  leads?: Lead[];
  onNavigate?: (view: string, options?: any) => void;
}

interface AttentionItem {
  id: string;
  icon: React.ReactNode;
  texto: string;
  diasEsperando: number;
  destino: string;
}

const diasDesde = (fechaIso: string): number => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fechaIso);
  objetivo.setHours(0, 0, 0, 0);
  return Math.round((hoy.getTime() - objetivo.getTime()) / 86400000);
};

/**
 * Franja de avisos que solo aparece cuando hay algo esperando demasiado — no es un contador
 * pasivo como las tarjetas del resumen ejecutivo, es la versión "esto ya lleva X días, mira
 * esto primero". Alcance a propósito: solo datos que ya existen (leads, conciertos), nada de
 * push/email — eso es una capa aparte para más adelante.
 */
export const NeedsAttentionBanner: React.FC<NeedsAttentionBannerProps> = ({
  concerts = [],
  leads = [],
  onNavigate,
}) => {
  const hoyIso = new Date().toISOString().slice(0, 10);

  const leadsSinResponder = leads
    .filter(
      (l) =>
        (l.estado === "pendiente_aprobacion" ||
          (l.pitch_generado && l.estado === "nuevo")) &&
        l.fecha_envio,
    )
    .map((l) => ({ lead: l, dias: diasDesde(l.fecha_envio!) }))
    .filter(({ dias }) => dias >= 3);

  const cobrosPendientes = concerts
    .filter((c) => c.fecha < hoyIso && c.estado_pago !== "pagado")
    .map((c) => ({ concert: c, dias: diasDesde(c.fecha) }))
    .filter(({ dias }) => dias >= 7);

  const items: AttentionItem[] = [
    ...leadsSinResponder.map(({ lead, dias }) => ({
      id: `lead-${lead.id}`,
      icon: <Mail className="w-4 h-4" />,
      texto: `${lead.nombre_sala} lleva ${dias} días sin respuesta tuya`,
      diasEsperando: dias,
      destino: "booking",
    })),
    ...cobrosPendientes.map(({ concert, dias }) => ({
      id: `cobro-${concert.id}`,
      icon: <DollarSign className="w-4 h-4" />,
      texto: `${concert.sala} (${concert.ciudad}) sin cobrar, ${dias} días desde el bolo`,
      diasEsperando: dias,
      destino: "finanzas",
    })),
  ]
    .sort((a, b) => b.diasEsperando - a.diasEsperando)
    .slice(0, 3);

  if (items.length === 0) return null;

  return (
    <div className="p-4 rounded-[var(--r-l)] bg-[var(--alert)]/10 space-y-2.5">
      <div className="flex items-center gap-2 text-[var(--alert)]">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-sans font-bold">
          Mira esto primero
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={onNavigate ? () => onNavigate(item.destino) : undefined}
            disabled={!onNavigate}
            className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] text-left transition-ui ${
              onNavigate
                ? "cursor-pointer hover:brightness-[1.03] active:scale-[0.97]"
                : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[var(--alert)] shrink-0">{item.icon}</span>
              <span className="text-sm text-[var(--ink)] truncate">
                {item.texto}
              </span>
            </div>
            {onNavigate && (
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
