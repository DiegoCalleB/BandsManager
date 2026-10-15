/**
 * Navegación mensual: botones, gestos táctiles, ratón y rueda.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useRef, useState } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarNavigationParams {
  calendarViewMode: "1m" | "2m" | "week" | "agenda";
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  setViewDate: Dispatch<SetStateAction<Date>>;
  selectedDate: Date;
  viewDate: Date;
}

/**
 * Navegación mensual: botones, gestos táctiles, ratón y rueda.
 * @param params Estado y callbacks del contenedor ({@link CalendarNavigationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarNavigation({ calendarViewMode, setSelectedDate, setViewDate, selectedDate, viewDate }: CalendarNavigationParams) {
  // Estado para dirección de deslizamiento y desplazamiento visual
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const [dragOffset, setDragOffset] = useState<number>(0);

  const touchStartX = useRef<number | null>(null);

  const touchStartY = useRef<number | null>(null);

  const touchDeltaX = useRef<number>(0);

  const isSwipingTouch = useRef<boolean>(false);

  const hasSwipedTouch = useRef<boolean>(false);

  const mouseStartX = useRef<number | null>(null);

  const mouseStartY = useRef<number | null>(null);

  const mouseDeltaX = useRef<number>(0);

  const isMouseDown = useRef<boolean>(false);

  const hasMouseDragged = useRef<boolean>(false);

  const lastWheelTime = useRef<number>(0);

  const handlePrevMonth = () => {
    setSlideDirection('right');
    if (calendarViewMode === 'week') {
      setSelectedDate((prev) => {
        const nextD = new Date(prev);
        nextD.setDate(nextD.getDate() - 7);
        return nextD;
      });
      setViewDate(() => {
        const nextD = new Date(selectedDate);
        nextD.setDate(nextD.getDate() - 7);
        return new Date(nextD.getFullYear(), nextD.getMonth(), 1);
      });
    } else {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setSlideDirection('left');
    if (calendarViewMode === 'week') {
      setSelectedDate((prev) => {
        const nextD = new Date(prev);
        nextD.setDate(nextD.getDate() + 7);
        return nextD;
      });
      setViewDate(() => {
        const nextD = new Date(selectedDate);
        nextD.setDate(nextD.getDate() + 7);
        return new Date(nextD.getFullYear(), nextD.getMonth(), 1);
      });
    } else {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    const currentMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (targetDate.getTime() > currentMonthDate.getTime()) {
      setSlideDirection('left');
    } else if (targetDate.getTime() < currentMonthDate.getTime()) {
      setSlideDirection('right');
    }
    setViewDate(targetDate);
    setSelectedDate(now);
  };

  // Gestos de deslizamiento táctil (móvil y tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwipingTouch.current = true;
    hasSwipedTouch.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingTouch.current || touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Priorizar intención horizontal sobre scroll vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 15) {
        hasSwipedTouch.current = true;
      }
      touchDeltaX.current = diffX;
      // Resistencia elástica para feedback táctil en tiempo real
      const dampened = Math.sign(diffX) * Math.min(50, Math.pow(Math.abs(diffX), 0.85));
      setDragOffset(dampened);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingTouch.current) return;
    const dx = touchDeltaX.current;
    const threshold = 40; // 40px para activar cambio de mes

    if (dx < -threshold) {
      handleNextMonth();
    } else if (dx > threshold) {
      handlePrevMonth();
    }

    isSwipingTouch.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    setDragOffset(0);
    setTimeout(() => {
      hasSwipedTouch.current = false;
    }, 120);
  };

  const handleTouchCancel = () => {
    isSwipingTouch.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    setDragOffset(0);
    hasSwipedTouch.current = false;
  };

  // Gestos de arrastre con ratón (escritorio)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
    mouseDeltaX.current = 0;
    isMouseDown.current = true;
    hasMouseDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartX.current === null || mouseStartY.current === null) return;
    const diffX = e.clientX - mouseStartX.current;
    const diffY = e.clientY - mouseStartY.current;

    if (Math.abs(diffX) > 15) {
      hasMouseDragged.current = true;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
      mouseDeltaX.current = diffX;
      const dampened = Math.sign(diffX) * Math.min(50, Math.pow(Math.abs(diffX), 0.85));
      setDragOffset(dampened);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDown.current) return;
    const dx = mouseDeltaX.current;
    const threshold = 50;

    if (hasMouseDragged.current) {
      if (dx < -threshold) {
        handleNextMonth();
      } else if (dx > threshold) {
        handlePrevMonth();
      }
    }

    isMouseDown.current = false;
    mouseStartX.current = null;
    mouseStartY.current = null;
    mouseDeltaX.current = 0;
    setDragOffset(0);
    setTimeout(() => {
      hasMouseDragged.current = false;
    }, 120);
  };

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      handleMouseUp();
    }
  };

  // Desplazamiento horizontal para trackpads / mousewheel horizontal
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 30) {
      const now = Date.now();
      if (now - lastWheelTime.current > 450) {
        lastWheelTime.current = now;
        if (e.deltaX > 0) {
          handleNextMonth();
        } else {
          handlePrevMonth();
        }
      }
    }
  };

  return { handlePrevMonth, handleNextMonth, handleGoToday, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, slideDirection, dragOffset };
}
