/**
 * Modo pantalla completa del calendario y estado del modo escenario.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useEffect, useRef, useState } from "react";
import type { Setlist } from "../../../types";

/**
 * Modo pantalla completa del calendario y estado del modo escenario.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarFullscreen() {
  // Estado para la vista de directo / modo escenario desde el calendario
  const [activeStageSetlist, setActiveStageSetlist] = useState<Setlist | null>(null);

  const [activeStageInitialMode, setActiveStageInitialMode] = useState<'directo' | 'ensayo'>('directo');

  // Estado y lógica para la vista a Pantalla Completa del Calendario
  const [isCalendarFullscreen, setIsCalendarFullscreen] = useState(false);

  const calendarContainerRef = useRef<HTMLDivElement>(null);

  const toggleCalendarFullscreen = React.useCallback(() => {
    if (!isCalendarFullscreen) {
      if (calendarContainerRef.current && calendarContainerRef.current.requestFullscreen) {
        calendarContainerRef.current.requestFullscreen().catch(() => {});
      }
      setIsCalendarFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsCalendarFullscreen(false);
    }
  }, [isCalendarFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCalendarFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return { calendarContainerRef, isCalendarFullscreen, toggleCalendarFullscreen, setActiveStageInitialMode, setActiveStageSetlist, activeStageSetlist, activeStageInitialMode };
}
