/**
 * Búsqueda, filtros por banda y choques entre eventos.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Concert, Rehearsal } from "../../../types";
import { peorSeveridadPorDia } from "../../../utils/calendarConflicts";
import { useCalendarConflicts } from "../useCalendarConflicts";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarFiltersParams {
  concerts: Concert[];
  filterBandMode: "active" | "all";
  isSameBandId: (id1?: string, id2?: string) => boolean;
  activeBandId: string;
  matchesConvocatoria: (evt: Concert | Rehearsal) => boolean;
  getEventBandName: (e: { bandName?: string; band_id?: string; }) => string;
  rehearsals: Rehearsal[];
  initialSelectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  setViewDate: Dispatch<SetStateAction<Date>>;
  initialSelectedEventId: string;
  setSelectedEventId: Dispatch<SetStateAction<string>>;
}

/**
 * Búsqueda, filtros por banda y choques entre eventos.
 * @param params Estado y callbacks del contenedor ({@link CalendarFiltersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarFilters({ concerts, filterBandMode, isSameBandId, activeBandId, matchesConvocatoria, getEventBandName, rehearsals, initialSelectedDate, setSelectedDate, setViewDate, initialSelectedEventId, setSelectedEventId }: CalendarFiltersParams) {
  // Estado de búsqueda rápida por palabra clave / sala / ciudad / notas / artista
  const [calendarSearchTerm, setCalendarSearchTerm] = useState<string>('');

  // Filtered concerts & rehearsals depending on filterBandMode, Convocatoria and search term
  const filteredConcerts = React.useMemo(() => {
    let list = concerts;
    if (filterBandMode === 'active') {
      list = concerts.filter((c) => {
        if (!c.band_id) return false;
        return isSameBandId(c.band_id, activeBandId);
      });
    }
    list = list.filter(matchesConvocatoria);

    if (calendarSearchTerm.trim()) {
      const q = calendarSearchTerm.trim().toLowerCase();
      list = list.filter((c) => {
        const matchSala = (c.sala || '').toLowerCase().includes(q);
        const matchCiudad = (c.ciudad || '').toLowerCase().includes(q);
        const matchDireccion = (c.direccion || '').toLowerCase().includes(q);
        const matchNotas = (c.notas || '').toLowerCase().includes(q);
        const matchBand = getEventBandName(c).toLowerCase().includes(q);
        const matchTipo = (c.tipo || '').toLowerCase().includes(q);
        const matchFecha = (c.fecha || '').toLowerCase().includes(q);
        return matchSala || matchCiudad || matchDireccion || matchNotas || matchBand || matchTipo || matchFecha;
      });
    }
    return list;
  }, [concerts, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId, calendarSearchTerm, getEventBandName]);

  const activeBandConcerts = React.useMemo(() => {
    return concerts
      .filter((c) => {
        if (!c.band_id) return false;
        return isSameBandId(c.band_id, activeBandId);
      })
      .filter(matchesConvocatoria);
  }, [concerts, activeBandId, isSameBandId, matchesConvocatoria]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals
      .filter((r) => {
        if (!r.band_id) return false;
        return isSameBandId(r.band_id, activeBandId);
      })
      .filter(matchesConvocatoria);
  }, [rehearsals, activeBandId, isSameBandId, matchesConvocatoria]);

  // Choques entre eventos (mismo detector que el aviso por email). Se ignoran las convocatorias
  // parciales que no incluyen al usuario: lo que no ve, no le choca.
  const eventosParaChoques = React.useMemo(
    () => ({ concerts: concerts.filter(matchesConvocatoria), rehearsals: rehearsals.filter(matchesConvocatoria) }),
    [concerts, rehearsals, matchesConvocatoria],
  );

  const choquesCalendario = useCalendarConflicts({
    concerts: eventosParaChoques.concerts,
    rehearsals: eventosParaChoques.rehearsals,
    bandId: activeBandId || '',
  });

  // Peor severidad por día, para marcar las celdas del mes y de la semana
  const diasConChoque = React.useMemo(() => peorSeveridadPorDia(choquesCalendario), [choquesCalendario]);

  const filteredRehearsals = React.useMemo(() => {
    let list = rehearsals;
    if (filterBandMode === 'active') {
      list = rehearsals.filter((r) => {
        if (!r.band_id) return false;
        return isSameBandId(r.band_id, activeBandId);
      });
    }
    list = list.filter(matchesConvocatoria);

    if (calendarSearchTerm.trim()) {
      const q = calendarSearchTerm.trim().toLowerCase();
      list = list.filter((r) => {
        const matchLugar = (r.lugar || '').toLowerCase().includes(q);
        const matchAsunto = (r.asunto || '').toLowerCase().includes(q);
        const matchNotas = (r.notas || '').toLowerCase().includes(q);
        const matchBand = getEventBandName(r).toLowerCase().includes(q);
        const matchFecha = (r.fecha || '').toLowerCase().includes(q);
        return matchLugar || matchAsunto || matchNotas || matchBand || matchFecha;
      });
    }
    return list;
  }, [rehearsals, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId, calendarSearchTerm, getEventBandName]);

  // Handle initial selected date / event ID passed as props
  useEffect(() => {
    if (initialSelectedDate) {
      const parts = initialSelectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const dt = new Date(y, m, d);
          setSelectedDate(dt);
          setViewDate(new Date(y, m, 1));
        }
      }
    } else if (initialSelectedEventId) {
      const conc = concerts.find((c) => c.id === initialSelectedEventId);
      const reh = rehearsals.find((r) => r.id === initialSelectedEventId);
      const eventDate = conc?.fecha || reh?.fecha;
      if (eventDate) {
        const parts = eventDate.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const dt = new Date(y, m, d);
            setSelectedDate(dt);
            setViewDate(new Date(y, m, 1));
            // Si el día tenía más de un evento, ir directo al que se pidió en vez del primero.
            setSelectedEventId(initialSelectedEventId);
          }
        }
      }
    }
  }, [initialSelectedDate, initialSelectedEventId, concerts, rehearsals, setSelectedDate, setSelectedEventId, setViewDate]);

  return { filteredConcerts, filteredRehearsals, calendarSearchTerm, setCalendarSearchTerm, activeBandConcerts, activeBandRehearsals, choquesCalendario, diasConChoque };
}
