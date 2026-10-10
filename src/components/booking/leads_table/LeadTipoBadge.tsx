/**
 * Insignia del tipo de lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../../ui/ShowIcon";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadTipoBadgeProps {
  tipoRaw: string;
}

/**
 * Insignia del tipo de lead.
 * @returns Sección de interfaz.
 */
export function LeadTipoBadge({ tipoRaw }: LeadTipoBadgeProps) {
    const t = (tipoRaw || "sala").toLowerCase().trim();
    if (t === "festival") {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 shrink-0">
    <ShowIcon inline emoji="🎪" />Festival
  </span>
      );
    }
    if (t === "discoteca" || t === "club") {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 shrink-0">
    <ShowIcon inline emoji="🪩" />Club
  </span>
      );
    }
    if (t === "teatro" || t === "auditorio") {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20 shrink-0">
    <ShowIcon inline emoji="🎭" />Teatro
  </span>
      );
    }
    if (t === "ayuntamiento") {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20 shrink-0">
    <ShowIcon inline emoji="🏛️" />Ayto
  </span>
      );
    }
    if (
      t === "medio" ||
      t === "prensa" ||
      t === "radio" ||
      t === "televisión"
    ) {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
    <ShowIcon inline emoji="📻" />Medio
  </span>
      );
    }
    if (
      t === "agencia" ||
      t === "manager" ||
      t === "promotor" ||
      t === "sello"
    ) {
      return (
  <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
    <ShowIcon inline emoji="💼" />Agencia
  </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] font-sans font-medium bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)] shrink-0">
  <ShowIcon inline emoji="🏛️" />Sala
      </span>
    );

}
