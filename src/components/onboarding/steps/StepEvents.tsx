import React from 'react';
import { Calendar, Plus, Trash2, MapPin, Ticket, Clock } from 'lucide-react';
import { QuickEventItem } from '../types';

interface StepEventsProps {
  events: QuickEventItem[];
  newEventTitle: string;
  setNewEventTitle: (v: string) => void;
  newEventType: 'concierto' | 'festival' | 'ensayo' | 'privado';
  setNewEventType: (v: 'concierto' | 'festival' | 'ensayo' | 'privado') => void;
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
  onAddEvent,
  onRemoveEvent,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2">
        <Calendar className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Próximos Conciertos & Ensayos (Agenda)
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
              className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--bg)] hover:border-[var(--hair)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-[var(--r-m)] flex flex-col items-center justify-center font-bold text-xs ${
                    ev.tipo === 'ensayo'
                      ? 'bg-[var(--acc)]/10 text-[var(--acc)]'
                      : 'bg-[var(--acc)]/10 text-[var(--acc)]'
                  }`}
                >
                  <span className="text-[9px] font-semibold">
                    {ev.fecha
                      ? new Date(ev.fecha).toLocaleDateString('es-ES', {
                          month: 'short',
                        })
                      : 'DÍA'}
                  </span>
                  <span className="text-sm leading-none">
                    {ev.fecha ? new Date(ev.fecha).getDate() : '--'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {ev.titulo}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)] capitalize">
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

              <button
                type="button"
                onClick={() => onRemoveEvent(ev.id)}
                className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--alert)]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Form */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)] tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[var(--acc)]" />
          Añadir Fecha a la Agenda
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Título / Sala (ej. Concierto Presentación Disco) *"
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
            />
          </div>

          <div>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] text-xs focus:outline-none focus:"
            >
              <option value="concierto">Concierto en Sala</option>
              <option value="festival">Festival</option>
              <option value="ensayo">Ensayo General</option>
              <option value="privado">Evento Privado</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] text-xs focus:outline-none focus:"
            />
          </div>

          <div>
            <input
              type="text"
              value={newEventCity}
              onChange={(e) => setNewEventCity(e.target.value)}
              placeholder="Ciudad (ej. Madrid)"
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
            />
          </div>

          <div>
            <input
              type="text"
              value={newEventVenue}
              onChange={(e) => setNewEventVenue(e.target.value)}
              placeholder="Sala / Recinto (ej. Sala Copérnico)"
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              value={newEventTicketUrl}
              onChange={(e) => setNewEventTicketUrl(e.target.value)}
              placeholder="Enlace de venta de entradas (Wegow, DICE, Eventbrite...)"
              className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onAddEvent}
            disabled={!newEventTitle.trim() || !newEventDate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir a la Agenda
          </button>
        </div>
      </div>
    </div>
  );
};
