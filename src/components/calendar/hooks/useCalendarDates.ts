/**
 * Mes, semana y día actuales derivados de la fecha de vista y campañas.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React from "react";
import { BookingCampaign } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarDatesParams {
  viewDate: Date;
  campaigns: BookingCampaign[];
  selectedDate: Date;
}

/**
 * Mes, semana y día actuales derivados de la fecha de vista y campañas.
 * @param params Estado y callbacks del contenedor ({@link CalendarDatesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarDates({ viewDate, campaigns, selectedDate }: CalendarDatesParams) {
  const currentYear = viewDate.getFullYear();

  const currentMonth = viewDate.getMonth();

 // 0 to 11

  // Second month calculations for dual month view
  const nextMonth = (currentMonth + 1) % 12;

  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const getWeekDays = (baseDate: Date) => {
    const curr = new Date(baseDate);
    const dayIndex = (curr.getDay() + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayIndex);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const todayStr = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Helper to find campaigns that target a specific date
  const getCampaignsForDate = React.useCallback(
    (dateStr: string): BookingCampaign[] => {
      if (!campaigns || campaigns.length === 0) return [];
      return campaigns.filter((c) => Array.isArray(c.targetDates) && c.targetDates.includes(dateStr));
    },
    [campaigns]
  );

  // Dynamic state for per-date schedules and gear checklists with localStorage persistence
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  return { todayStr, monthNames, selectedDateKey, currentMonth, nextMonth, currentYear, nextMonthYear, getWeekDays, getCampaignsForDate };
}
