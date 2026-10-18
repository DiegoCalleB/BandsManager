/**
 * Insignia del estado de relación con una banda (aliada, contactada, propuesta de swap…).
 * Es un componente propio para que la tabla y las tarjetas compartan la misma presentación.
 */
import { Clock, Handshake, Radio, Repeat, X, Zap } from "lucide-react";
import type { BandRelationshipStatus } from "../../types";

/**
 * Pinta la insignia del estado indicado.
 * @param props.status Estado de relación de la banda.
 * @returns La insignia coloreada.
 */
export function BandStatusBadge({ status }: { status: BandRelationshipStatus }) {

  switch (status) {
    case "colegas_aliados":
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/15 text-[var(--ok)] whitespace-nowrap shrink-0">
    <Handshake className="w-3 h-3 text-[var(--ok)] shrink-0" />
    <span>Colegas / Aliados</span>
  </span>
      );
    case "concierto_agendado":
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)]/15 text-[var(--ink)] whitespace-nowrap shrink-0">
    <Zap className="w-3 h-3 text-[var(--acc)] shrink-0" />
    <span>Concierto Agendado</span>
  </span>
      );
    case "intercambio_propuesto":
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)]/15 text-[var(--ink)] whitespace-nowrap shrink-0">
    <Repeat className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
    <span>Intercambio Propuesto</span>
  </span>
      );
    case "pendiente_respuesta":
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--tentative)]/15 text-[var(--tentative)] whitespace-nowrap shrink-0">
    <Clock className="w-3 h-3 text-[var(--tentative)]/80 shrink-0" />
    <span>Pendiente respuesta</span>
  </span>
      );
    case "no_disponible":
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--alert)]/15 text-[var(--ink)] whitespace-nowrap shrink-0">
    <X className="w-3 h-3 text-[var(--alert)] shrink-0" />
    <span>No Disponible</span>
  </span>
      );
    case "sin_contactar":
    default:
      return (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/80 text-[var(--ink-2)] whitespace-nowrap shrink-0">
    <Radio className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
    <span>Sin Contactar</span>
  </span>
      );
  }
}
