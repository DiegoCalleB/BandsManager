/**
 * Día libre: campañas de booking activas o invitación a crear un evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Building2,Calendar,MapPin,Plus,Target,Users } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import { UpcomingEventsList } from "./UpcomingEventsList";

/**
 * Día libre: campañas de booking activas o invitación a crear un evento.
 * @returns Sección de interfaz.
 */
export function FreeDayCampaigns() {
  const { getCampaignsForDate, selectedDateKey, selectedDate, monthNames, onNavigate, setConcCiudad, setConcAforo, setConcNotas, setShowCreateModal, textTitle, textSub } = useCalendar();
  return (
    <>
      <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
        {getCampaignsForDate(selectedDateKey).length > 0 ? (
          <div className="w-full text-left rounded-[var(--r-l)] bg-[var(--acc)]/40 p-4/20">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--acc)]/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--ink)] flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-micro font-mono font-extrabold text-[var(--ink)] bg-[var(--acc)]/20 px-2 py-0.5 rounded-[var(--r-pill)] ">
                    <ShowIcon inline emoji="🎯" />Fecha objetivo de campaña
                  </span>
                  <p className="text-xs font-mono text-[var(--ink-2)] font-bold mt-0.5">
                    {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {getCampaignsForDate(selectedDateKey).map((camp) => (
              <div key={camp.id} className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-display text-[var(--ink-2)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[var(--r-pill)]" style={{ backgroundColor: camp.color || '#8b5cf6' }} />
                    {camp.name}
                  </h4>
                  {camp.isActive && (
                    <span className="text-micro font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
                      ACTIVA
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-2)]">
                  <span className="inline-flex items-center gap-1 text-[var(--acc)] text-xs">
                    <MapPin className="w-3 h-3 text-[var(--acc)]" />
                    {camp.targetCities?.join(', ') || 'Cualquier ciudad'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--acc)] text-xs">
                    <Users className="w-3 h-3 text-[var(--acc)]" />
                    {camp.minCapacity} - {camp.maxCapacity} pax
                  </span>
                </div>

                {camp.notes && (
                  <p className="text-xs text-[var(--ink-2)] italic bg-[var(--sunken)] p-2 rounded-[var(--r-m)] ">
                    &ldquo;{camp.notes}&rdquo;
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  {onNavigate && (
                    <Button
                      variant="neutral"
                      size="xs"
                      type="button"
                      onClick={() => onNavigate('booking', { campaignFilter: camp.id })}
                      className="flex-1 items-center justify-center gap-1.5"
                    >
                      <Building2 className="w-3 h-3 text-[var(--acc)]" />
                      <span>Salas CRM</span>
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setConcCiudad(camp.targetCities?.[0] || 'Madrid');
                      setConcAforo(String(camp.minCapacity || 250));
                      setConcNotas(`Concierto agendado para la campaña "${camp.name}".`);
                      setShowCreateModal('concert');
                    }}
                    className="flex-1 items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Confirmar concierto</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`p-3 rounded-[var(--r-pill)] ${'bg-[var(--sunken)] text-[var(--ink-2)]'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-xs font-mono font-bold ${'text-[var(--ink-2)]'}`}
              >
                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
              </p>
              <h4 className={`text-sm font-bold font-display mt-1 ${textTitle}`}>Día sin eventos agendados</h4>
              <p className={`text-micro font-mono mt-1 ${textSub}`}>
                Selecciona un día con concierto en el calendario para ver su logística y ubicación GPS.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setShowCreateModal('rehearsal')}
                className="items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar ensayo</span>
              </Button>

              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => setShowCreateModal('concert')}
                className="items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar concierto</span>
              </Button>
            </div>
          </>
        )}

        {/* Quick GPS & Upcoming Events List */}
        <UpcomingEventsList />
      </div>
    </>
  );
}
