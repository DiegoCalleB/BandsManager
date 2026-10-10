/**
 * Lista de próximos eventos filtrada y ordenada para la agenda.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";
import { BookingCampaign, Concert, Rehearsal } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface UpcomingEventsParams {
  filteredConcerts: Concert[];
  todayStr: string;
  monthNames: string[];
  getEventBandName: (e: { bandName?: string; band_id?: string; }) => string;
  filteredRehearsals: Rehearsal[];
  campaigns: BookingCampaign[];
  activeBandName: string;
}

/**
 * Lista de próximos eventos filtrada y ordenada para la agenda.
 * @param params Estado y callbacks del contenedor ({@link UpcomingEventsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useUpcomingEvents({ filteredConcerts, todayStr, monthNames, getEventBandName, filteredRehearsals, campaigns, activeBandName }: UpcomingEventsParams) {
  // Upcoming events filter state:'todos' |'conciertos' |'ensayos' |'campañas'
  const [upcomingFilter, setUpcomingFilter] = useState<'todos' | 'conciertos' | 'ensayos' | 'campañas'>('todos');

  // Upcoming events starting from today (filters out past dates)
  const upcomingCalendarEvents = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'concierto' | 'ensayo' | 'reunion' | 'campaña';
      title: string;
      fecha: string;
      day: string;
      month: string;
      salaOrLugar: string;
      ciudad?: string;
      direccion?: string;
      locationQuery: string;
      bandName: string;
      badge: string;
      campaign?: BookingCampaign;
    }> = [];

    // Filter concerts that are today or in the future
    filteredConcerts.forEach((c) => {
      if (!c.fecha || c.fecha < todayStr) return;
      const parts = c.fecha.split('-');
      if (parts.length !== 3) return;
      const day = parts[2];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';

      list.push({
        id: c.id,
        type: 'concierto',
        title: `${c.sala}${c.ciudad ? ` (${c.ciudad})` : ''}`,
        fecha: c.fecha,
        day,
        month,
        salaOrLugar: c.sala,
        ciudad: c.ciudad,
        direccion: c.direccion,
        locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
        bandName: getEventBandName(c),
        badge: c.contrato_firmado ? 'Contrato Firmado' : 'Confirmado',
      });
    });

    // Filter rehearsals that are today or in the future
    filteredRehearsals.forEach((r) => {
      if (!r.fecha || r.fecha < todayStr) return;
      const parts = r.fecha.split('-');
      if (parts.length !== 3) return;
      const day = parts[2];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';
      const isReu = r.tipo_evento === 'reunion';

      list.push({
        id: r.id,
        type: isReu ? 'reunion' : 'ensayo',
        title: isReu ? r.asunto || 'Reunión de Banda' : r.lugar ? `Ensayo en ${r.lugar}` : 'Ensayo General',
        fecha: r.fecha,
        day,
        month,
        salaOrLugar: isReu ? r.lugar || 'Online' : r.lugar || 'Local de Ensayo',
        ciudad: undefined,
        direccion: undefined,
        locationQuery: isReu
          ? r.lugar && !r.lugar.toLowerCase().includes('online') && !r.lugar.toLowerCase().includes('http')
            ? r.lugar
            : undefined
          : `${r.lugar || 'Local de Ensayo'}, Madrid`,
        bandName: getEventBandName(r),
        badge: isReu ? (r.estado === 'completado' ? 'Realizada' : 'Convocada') : r.estado === 'completado' ? 'Completado' : 'Programado',
      });
    });

    // Add campaign target dates (only if no confirmed concert on that same date)
    (campaigns || []).forEach((camp) => {
      (camp.targetDates || []).forEach((tDate) => {
        if (tDate < todayStr) return;
        const alreadyHasConcert = filteredConcerts.some((c) => c.fecha === tDate);
        if (alreadyHasConcert) return;

        const parts = tDate.split('-');
        if (parts.length !== 3) return;
        const day = parts[2];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';

        list.push({
          id: `camp-date-${camp.id}-${tDate}`,
          type: 'campaña',
          title: `🎯 Posible Concierto: ${camp.name}`,
          fecha: tDate,
          day,
          month,
          salaOrLugar: `Salas en ${camp.targetCities?.join(', ') || 'Ciudad objetivo'}`,
          ciudad: camp.targetCities?.[0] || 'Madrid',
          direccion: undefined,
          locationQuery: `Salas ${camp.targetCities?.join(' ')}, España`,
          bandName: activeBandName || 'Tu banda',
          badge: camp.isActive ? 'Campaña Activa' : 'Objetivo Campaña',
          campaign: camp,
        });
      });
    });

    list.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return list;
  }, [filteredConcerts, filteredRehearsals, campaigns, todayStr, activeBandName, monthNames]);

  return { upcomingCalendarEvents, upcomingFilter, setUpcomingFilter };
}
