import { Calendar, Plus, X } from "lucide-react";
import type { BookingCampaign } from "../../types";
import { HolidayDateWarning } from "../common/HolidayDateWarning";
import { ShowIcon } from "../ui/ShowIcon";
import { IconButton } from "../ui";

interface Props {
  formData: Partial<BookingCampaign>;
  setFormData: (datos: Partial<BookingCampaign>) => void;
}

/**
 * Fechas de la campaña. En salas: fechas concretas (se marcan en el Calendario y las usan los pitches). En festivales:
 * una ventana opcional «desde – hasta» que solo filtra por época del año; los festivales sin fecha conocida entran siempre.
 */
export function CampanaFechasFields({ formData, setFormData }: Props) {
  if (formData.alcance === "festivales") {
    const desde = formData.campaignStartDate || "";
    const hasta = formData.campaignEndDate || "";
    return (
      <div>
        <p className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">Fechas de los festivales (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-sans text-[var(--ink-2)]">
            Desde
            <input data-raw type="date" value={desde} max={hasta || undefined} onChange={(e) => setFormData({ ...formData, campaignStartDate: e.target.value })} className="mt-1 w-full rounded-[var(--r-s)] bg-[var(--sunken)] px-3 py-2 text-xs font-sans text-[var(--ink)]" />
          </label>
          <label className="text-xs font-sans text-[var(--ink-2)]">
            Hasta
            <input data-raw type="date" value={hasta} min={desde || undefined} onChange={(e) => setFormData({ ...formData, campaignEndDate: e.target.value })} className="mt-1 w-full rounded-[var(--r-s)] bg-[var(--sunken)] px-3 py-2 text-xs font-sans text-[var(--ink)]" />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-[var(--ink-2)] italic">
          <ShowIcon inline emoji="💡" />Solo salen los festivales que caen en esa época. Se compara por época del año: uno que se celebró en julio de 2026 cuenta para un verano de 2027. Los festivales sin fecha conocida entran siempre. Déjalo vacío para no filtrar.
        </p>
      </div>
    );
  }

  const handleAddDate = (nueva: string) => {
    if (!nueva) return;
    const actuales = formData.targetDates || [];
    if (!actuales.includes(nueva)) setFormData({ ...formData, targetDates: [...actuales, nueva].sort() });
  };

  const handleRemoveDate = (indice: number) => {
    const actuales = [...(formData.targetDates || [])];
    actuales.splice(indice, 1);
    setFormData({ ...formData, targetDates: actuales });
  };

  return (
    <div>
      <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
        Fechas Objetivo (se marcarán en Calendario y pitches IA) *
      </label>
      <div className="space-y-2 mb-2.5">
        <div className="flex flex-wrap gap-2">
          {formData.targetDates?.map((date, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-1 bg-[var(--sunken)] px-2.5 py-1.5 rounded-[var(--r-m)] text-[var(--ink)]"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <input data-raw
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const next = [...(formData.targetDates || [])];
                    next[idx] = e.target.value;
                    next.sort();
                    setFormData({ ...formData, targetDates: next });
                  }}
                  className="bg-transparent text-xs font-sans font-bold text-[var(--ink)] p-0 focus:ring-0 cursor-pointer"
                />
                <IconButton
                  label="Eliminar fecha"
                  variant="danger"
                  type="button"
                  onClick={() => handleRemoveDate(idx)}
                  className="ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              </div>
              <HolidayDateWarning date={date} compact />
            </div>
          ))}

          <div className="flex items-center gap-1.5 bg-[var(--hair)]/10 hover:bg-[var(--hair)]/20 rounded-[var(--r-m)] px-2.5 py-1 text-[var(--ink-2)]">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-sans font-bold">
              Añadir Fecha:
            </span>
            <input data-raw aria-label="Fechas objetivo (se marcarán en calendario y pitches IA)"
              type="date"
              onChange={(e) => {
                handleAddDate(e.target.value);
                e.target.value = "";
              }}
              className="bg-transparent text-xs font-sans text-[var(--acc-ink)] p-0 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-[var(--ink-2)] italic">
        <ShowIcon inline emoji="💡" />Consejo: Las fechas añadidas aparecerán destacadas con
        badge de campaña en el Calendario y serán propuestas
        automáticamente por los agentes de IA al redactar pitches a
        salas.
      </p>
    </div>
  );
}
