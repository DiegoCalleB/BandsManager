/**
 * «¿A quién puedo escribir?»: filtra el listado por estado de contacto (enviable, revisar, formulario…) con su
 * recuento, y deja seleccionar de golpe todos los enviables para preparar el envío. Ver `utils/estadoDeContacto.ts`.
 */
import { useMemo } from "react";
import { contarPorContacto, estadoDeContacto, ESTADOS_DE_CONTACTO, ETIQUETA_CONTACTO, type FiltroContacto } from "../../../utils/estadoDeContacto";
import { Button } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

export function FiltroContactoChips() {
  const { sectionTab, sectionLeads, filteredLeads, contactoFilter, setContactoFilter, setSelectedLeadIds } = useBookingCrm();
  const cuenta = useMemo(() => contarPorContacto(sectionLeads), [sectionLeads]);
  const enviablesVisibles = useMemo(() => filteredLeads.filter((l) => estadoDeContacto(l).estado === "enviable"), [filteredLeads]);
  if (sectionTab !== "salas") return null;

  const chip = (valor: FiltroContacto, texto: string, n: number, titulo?: string) => (
    <button
      key={valor}
      type="button"
      title={titulo}
      aria-pressed={contactoFilter === valor}
      onClick={() => setContactoFilter(contactoFilter === valor ? "todos" : valor)}
      className={`shrink-0 rounded-[var(--r-pill)] px-3 py-1.5 text-xs font-semibold font-sans transition-colors ${
        contactoFilter === valor ? "bg-[var(--acc)] text-[var(--on-acc)]" : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
      }`}
    >
      {texto} <span className="tabular-nums opacity-80">{n}</span>
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Filtrar por contacto">
      {ESTADOS_DE_CONTACTO.filter((e) => cuenta[e] > 0 || contactoFilter === e).map((e) => chip(e, ETIQUETA_CONTACTO[e], cuenta[e]))}
      {enviablesVisibles.length > 0 && (
        <Button
          variant="neutral"
          size="sm"
          id="crm-select-enviables"
          type="button"
          className="shrink-0"
          title="Marca todos los de la lista con email fiable para generar pitches o enviarles"
          onClick={() => setSelectedLeadIds(enviablesVisibles.map((l) => l.id))}
        >
          Seleccionar {enviablesVisibles.length} enviables
        </Button>
      )}
    </div>
  );
}
