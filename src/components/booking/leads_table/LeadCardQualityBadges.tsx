/**
 * Insignias de calidad, entrega y teléfonos de la tarjeta.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Instagram,Phone,Smartphone } from "lucide-react";
import { Lead } from "../../../types";
import { ReliabilityBadge } from "../../common/ReliabilityBadge";
import { EmailDeliveryTicks } from "../EmailDeliveryTicks";
import { LeadHealthBadge } from "../LeadHealthBadge";
import { LeadDatesInfo } from "./LeadDatesInfo";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadCardQualityBadgesProps {
  lead: Lead;
  hasMovil: boolean;
  rawMovil: string;
  hasFijo: boolean;
  rawFijo: string;
}

/**
 * Insignias de calidad, entrega y teléfonos de la tarjeta.
 * @returns Sección de interfaz.
 */
export function LeadCardQualityBadges({ lead, hasMovil, rawMovil, hasFijo, rawFijo }: LeadCardQualityBadgesProps) {
  return (
    <>
      {/* Quality Badges, Delivery Status & Phone Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
  <EmailDeliveryTicks lead={lead} size="sm" showLabel={true} />
  <LeadHealthBadge
    lead={lead}
    showDescription={true}
    size="sm"
  />
  <ReliabilityBadge item={lead} size="sm" />

  {/* Icono de Teléfono Móvil disponible */}
  {hasMovil ? (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-semibold bg-[var(--ok)] text-[var(--on-ok)] shadow-2xs"
      title={`Teléfono móvil (WhatsApp disponible): ${rawMovil}`}
    >
      <Smartphone className="w-3 h-3 text-[var(--ok)] shrink-0" />
      <span className="hidden xs:inline">Móvil</span>
    </span>
  ) : null}

  {/* Icono de Teléfono Fijo disponible */}
  {hasFijo ? (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-semibold bg-[var(--acc)] text-[var(--on-acc)] shadow-2xs"
      title={`Teléfono fijo de sala: ${rawFijo}`}
    >
      <Phone className="w-3 h-3 text-[var(--acc)] shrink-0" />
      <span className="hidden xs:inline">Fijo</span>
    </span>
  ) : null}

  {/* Icono de Instagram disponible */}
  {lead.instagram ? (
    <a
      href={
      lead.instagram.startsWith("http")
        ? lead.instagram
        : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
      }
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-semibold bg-pink-500/15 text-pink-500 border border-pink-500/25 shadow-2xs hover:bg-pink-500/25 transition-colors"
      title={`Instagram: ${lead.instagram}`}
    >
      <Instagram className="w-3 h-3 text-pink-500 shrink-0" />
      <span className="hidden xs:inline">
      {lead.instagram.startsWith("@")
        ? lead.instagram
        : `@${lead.instagram}`}
      </span>
    </a>
  ) : null}

  {/* Icono de Fechas Libres / Disposicion de Campaña */}
  <LeadDatesInfo lead={lead} />
      </div>
    </>
  );
}
