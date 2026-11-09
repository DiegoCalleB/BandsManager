/**
 * «Confirmar»: la banda responde de un email que caducó (se leyó en la web hace más de 90 días). Un clic lo vuelve
 * enviable otros 90 días. Solo aparece cuando el email se puede confirmar (`campoConfirmable`).
 */
import { Check } from "lucide-react";
import type { Lead } from "../../../types";
import { campoConfirmable, confirmarEmailPorPersona } from "../../../utils/confirmarEmail";
import { useLeadsTable } from "./LeadsTableContext";

export function BotonConfirmarEmail({ lead }: { lead: Lead }) {
  const { onUpdateLead } = useLeadsTable();
  const campo = campoConfirmable(lead);
  if (!campo) return null;
  const confirmar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const datos_fuentes = confirmarEmailPorPersona((lead as { datos_fuentes?: unknown }).datos_fuentes, campo);
    // `confirmarEmail` solo dice qué campo: la procedencia definitiva la fija el servidor.
    onUpdateLead(lead.id, { confirmarEmail: campo, datos_fuentes } as Partial<Lead>);
  };
  return (
    <button
      type="button"
      onClick={confirmar}
      title={`Confirmo que ${lead[campo]} sigue siendo el contacto correcto. Vale 90 días.`}
      className="mt-0.5 inline-flex w-fit items-center gap-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] px-2 py-0.5 text-micro font-semibold text-[var(--acc-ink)] hover:bg-[var(--sunken)]"
    >
      <Check className="h-2.5 w-2.5" aria-hidden />
      Confirmar email
    </button>
  );
}
