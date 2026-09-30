import React from "react";
import { Calendar, Plus, Trash2, MapPin, Ticket, Clock } from "lucide-react";
import { QuickEventItem } from "../types";
import { ShowIcon } from '../../ui/ShowIcon';
import { Button, Input, Select, Textarea } from '../../ui';

interface StepEventsProps {
  events: QuickEventItem[];
  newEventTitle: string;
  setNewEventTitle: (v: string) => void;
  newEventType: "concierto" | "festival" | "ensayo" | "privado";
  setNewEventType: (v: "concierto" | "festival" | "ensayo" | "privado") => void;
  newEventDate: string;
  setNewEventDate: (v: string) => void;
  newEventTime: string;
  setNewEventTime: (v: string) => void;
  newEventCity: string;
  setNewEventCity: (v: string) => void;
  newEventVenue: string;
  setNewEventVenue: (v: string) => void;
  newEventTicketUrl: string;
  setNewEventTicketUrl: (v: string) => void;
  newEventAttendancePropia?: number;
  setNewEventAttendancePropia?: (v: number) => void;
  newEventAttendanceOtras?: number;
  setNewEventAttendanceOtras?: (v: number) => void;
  newEventSharedBands?: string;
  setNewEventSharedBands?: (v: string) => void;
  newEventPostShowReview?: string;
  setNewEventPostShowReview?: (v: string) => void;
  newEventIsMilestone?: boolean;
  setNewEventIsMilestone?: (v: boolean) => void;
  onAddEvent: () => void;
  onRemoveEvent: (id: string) => void;
}

export const StepEvents: React.FC<StepEventsProps> = ({
  events,
  newEventTitle,
  setNewEventTitle,
  newEventType,
  setNewEventType,
  newEventDate,
  setNewEventDate,
  newEventTime,
  setNewEventTime,
  newEventCity,
  setNewEventCity,
  newEventVenue,
  setNewEventVenue,
  newEventTicketUrl,
  setNewEventTicketUrl,
  newEventAttendancePropia = 0,
  setNewEventAttendancePropia,
  newEventAttendanceOtras = 0,
  setNewEventAttendanceOtras,
  newEventSharedBands = "",
  setNewEventSharedBands,
  newEventPostShowReview = "",
  setNewEventPostShowReview,
  newEventIsMilestone = false,
  setNewEventIsMilestone,
  onAddEvent,
  onRemoveEvent,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2">
        <Calendar className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Próximos conciertos y ensayos (Agenda)
        </h3>
      </div>

      <p className="text-xs text-[var(--ink-2)]">
        Publica tus próximas fechas para que tus fans compren entradas y los
        promotores vean que tenéis una gira activa.
      </p>

      {/* Events List */}
      {events.length > 0 && (
        <div className="space-y-2.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-[var(--r-m)] flex flex-col items-center justify-center font-bold text-xs ${
                    ev.tipo === "ensayo"
                      ? "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                      : "bg-[var(--acc)]/10 text-[var(--acc-ink)]"
                  }`}
                >
                  <span className="text-micro font-semibold">
                    {ev.fecha
                      ? new Date(ev.fecha).toLocaleDateString("es-ES", {
                          month: "short",
                        })
                      : "DÍA"}
                  </span>
                  <span className="text-sm leading-none">
                    {ev.fecha ? new Date(ev.fecha).getDate() : "--"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {ev.titulo}
                    </span>
                    <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)] capitalize">
                      {ev.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] mt-0.5">
                    {ev.ciudad && <span>{ev.ciudad}</span>}
                    {ev.lugar && <span>· {ev.lugar}</span>}
                    {ev.hora && <span>· {ev.hora}h</span>}
                  </div>
                </div>
              </div>

              <button aria-label="Eliminar"
                type="button"
                onClick={() => onRemoveEvent(ev.id)}
                className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--alert)]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Form */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[var(--acc)]" />
          Añadir fecha a la agenda
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              size="sm"
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Título / sala (ej. Concierto presentación disco) *"
              className="w-full"
            />
          </div>

          <div>
            <Select
              size="sm"
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as any)}
              wrapperClassName="w-full"
            >
              <option value="concierto">Concierto en sala</option>
              <option value="festival">Festival</option>
              <option value="ensayo">Ensayo general</option>
              <option value="privado">Evento Privado</option>
            </Select>
          </div>

          <div>
            <Input
              size="sm"
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Input
              size="sm"
              type="text"
              value={newEventCity}
              onChange={(e) => setNewEventCity(e.target.value)}
              placeholder="Ciudad (ej. Madrid)"
              className="w-full"
            />
          </div>

          <div>
            <Input
              size="sm"
              type="text"
              value={newEventVenue}
              onChange={(e) => setNewEventVenue(e.target.value)}
              placeholder="Sala / Recinto (ej. Sala Copérnico)"
              className="w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              size="sm"
              type="text"
              value={newEventTicketUrl}
              onChange={(e) => setNewEventTicketUrl(e.target.value)}
              placeholder="Enlace de venta de entradas (Wegow, DICE, Eventbrite…)"
              className="w-full"
            />
          </div>

          {/* Opcional: Datos de Afluencia e Impresiones Post-Show */}
          <div className="sm:col-span-3 p-3 rounded-[var(--r-m)] bg-[var(--acc)]/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--acc)]">
                <ShowIcon inline emoji="📊" />Éxito / Afluencia Real (Opcional - Contexto para Agente IA)
              </span>
              {setNewEventIsMilestone && (
                <label className="flex items-center gap-1.5 cursor-pointer text-micro font-mono text-[var(--acc-ink)] font-bold bg-[var(--acc)]/20 px-2 py-0.5 rounded ">
                  <input
                    type="checkbox"
                    checked={newEventIsMilestone}
                    onChange={(e) => setNewEventIsMilestone(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span><ShowIcon inline emoji="⭐" />Llenazo / hito clave</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Input
                  size="sm"
                  type="number"
                  value={newEventAttendancePropia || ""}
                  onChange={(e) =>
                    setNewEventAttendancePropia?.(Number(e.target.value))
                  }
                  placeholder="Asistentes propios (ej. 250 espect.)"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  size="sm"
                  type="text"
                  value={newEventSharedBands}
                  onChange={(e) => setNewEventSharedBands?.(e.target.value)}
                  placeholder="Grupos compartidos (ej. La Pegatina)"
                  className="w-full"
                />
              </div>
            </div>

            {setNewEventPostShowReview && (
              <div>
                <Textarea
                  rows={2}
                  value={newEventPostShowReview}
                  onChange={(e) => setNewEventPostShowReview(e.target.value)}
                  placeholder="Resumen del directo o nota de voz (ej. Lleno absoluto en la sala, respuesta brutal del público)"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            size="xs"
            type="button"
            onClick={onAddEvent}
            disabled={!newEventTitle.trim() || !newEventDate}
            className="items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir a la agenda
          </Button>
        </div>
      </div>
    </div>
  );
};
