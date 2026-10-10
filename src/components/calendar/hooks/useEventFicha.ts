/**
 * Selección de evento, ficha modal y navegación entre eventos con gestos.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { WeatherAlert } from "../../../services/weatherService";
import { Concert, Rehearsal } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EventFichaParams {
  filteredConcerts: Concert[];
  filteredRehearsals: Rehearsal[];
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  setSelectedEventId: Dispatch<SetStateAction<string>>;
  selectedEventId: string;
}

/**
 * Selección de evento, ficha modal y navegación entre eventos con gestos.
 * @param params Estado y callbacks del contenedor ({@link EventFichaParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventFicha({ filteredConcerts, filteredRehearsals, setSelectedDate, setSelectedEventId, selectedEventId }: EventFichaParams) {
  // Ficha Modal Emergente y Navegación Cronológica: lista unificada de conciertos + ensayos
  // de la banda activa, ordenada por fecha, para poder pasar de uno a otro con < / > sin
  // tener que volver al calendario y buscar el siguiente a mano.
  const [showEventFichaModal, setShowEventFichaModal] = useState(false);

  const [modalWeatherAlerts] = useState<WeatherAlert[]>([]);

  // Usa filteredConcerts/filteredRehearsals (no activeBandConcerts/activeBandRehearsals): esas
  // dos ya respetan el toggle"Todos / banda activa" y la convocatoria con el que se pintan el
  // resto de vistas del calendario (mes, semana, agenda). Si la navegación de la Ficha Modal
  // usara solo la banda activa, un clic en un evento de"Todos" caía fuera de la lista y el
  // contador se quedaba clavado en"1 de 1" aunque hubiera 8 eventos visibles en pantalla.
  const allChronologicalEvents = React.useMemo(() => {
    type ChronoEvent = {
      id: string;
      fecha: string;
      kind: 'concert' | 'rehearsal';
      data: Concert | Rehearsal;
    };
    const combined: ChronoEvent[] = [
      ...filteredConcerts.map((c) => ({
        id: c.id,
        fecha: c.fecha,
        kind: 'concert' as const,
        data: c,
      })),
      ...filteredRehearsals.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        kind: 'rehearsal' as const,
        data: r,
      })),
    ];
    combined.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    return combined;
  }, [filteredConcerts, filteredRehearsals]);

  const handleSelectEvent = React.useCallback((evt: { id: string; fecha: string }) => {
    const dateStr = evt.fecha.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setSelectedDate(new Date(y, m, d));
      }
    }
    setSelectedEventId(evt.id);
    setShowEventFichaModal(true);
  }, [setSelectedDate, setSelectedEventId, setShowEventFichaModal]);

  const activeChronoIndex = React.useMemo(
    () => (selectedEventId ? allChronologicalEvents.findIndex((e) => e.id === selectedEventId) : -1),
    [allChronologicalEvents, selectedEventId]
  );

  const goToAdjacentEvent = React.useCallback(
    (direction: 1 | -1) => {
      if (allChronologicalEvents.length === 0) return;
      const currentIndex = activeChronoIndex >= 0 ? activeChronoIndex : 0;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= allChronologicalEvents.length) return;
      handleSelectEvent(allChronologicalEvents[nextIndex].data);
    },
    [allChronologicalEvents, activeChronoIndex, handleSelectEvent]
  );

  // Atajos de teclado de la Ficha Modal: Esc ya lo gestiona ModalPortal internamente.
  useEffect(() => {
    if (!showEventFichaModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToAdjacentEvent(-1);
      else if (e.key === 'ArrowRight') goToAdjacentEvent(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEventFichaModal, goToAdjacentEvent]);

  return { showEventFichaModal, setShowEventFichaModal, handleSelectEvent, allChronologicalEvents, activeChronoIndex, goToAdjacentEvent, modalWeatherAlerts };
}
