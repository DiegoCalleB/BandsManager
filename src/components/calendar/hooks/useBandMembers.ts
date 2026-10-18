/**
 * Banda destino de nuevos eventos, miembros efectivos y filtro por convocatoria.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";
import { Concert, Rehearsal } from "../../../types";
import type { CalendarUser } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandMembersParams {
  activeBandId: string;
  currentUser?: CalendarUser;
  bandUsers: { id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string; }[];
}

/**
 * Banda destino de nuevos eventos, miembros efectivos y filtro por convocatoria.
 * @param params Estado y callbacks del contenedor ({@link BandMembersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandMembers({ activeBandId, currentUser, bandUsers }: BandMembersParams) {
  // Form state for selected band when creating rehearsal/concert
  const [selectedBandIdForNewEvent, setSelectedBandIdForNewEvent] = useState(activeBandId);

  // Effective band members list for Convocatoria filtered by target band of the event
  // Antes esto era la formación real de una banda concreta y se usaba
  // como lista por defecto de"miembros" para CUALQUIER banda sin integrantes cargados todavía:
  // cualquier banda nueva programando su primer ensayo veía a los compañeros de banda de Diego
  // como asistentes seleccionables. Sin datos reales, el único miembro real disponible es quien
  // ha iniciado sesión.
  const defaultMembers = React.useMemo(
    () =>
      currentUser
        ? [
            {
              id: currentUser.id,
              name: currentUser.name || currentUser.username || 'Miembro',
              role: currentUser.role || 'member',
            },
          ]
        : [],
    [currentUser]
  );

  const effectiveBandMembers = React.useMemo(() => {
    const targetBandId = selectedBandIdForNewEvent || activeBandId || '';
    const targetClean = targetBandId
      .replace(/^(band|reg)-/, '')
      .replace(/-\d+$/, '')
      .toLowerCase();

    if (bandUsers && bandUsers.length > 0) {
      const filtered = bandUsers.filter((u) => {
        const uClean = (u.band_id || '')
          .replace(/^(band|reg)-/, '')
          .replace(/-\d+$/, '')
          .toLowerCase();
        const uBandName = (u.bandName || '').toLowerCase();
        return uClean === targetClean || uBandName.includes(targetClean);
      });

      const list = filtered.length > 0 ? filtered : bandUsers;
      return list.map((u) => ({
        id: u.id,
        name: u.name || u.username || 'Miembro',
        role: u.role || 'member',
        instrument: u.instrument,
      }));
    }
    return defaultMembers;
  }, [bandUsers, selectedBandIdForNewEvent, activeBandId, defaultMembers]);

  // Filter helper by Convocatoria (Banda Completa vs Convocatoria Parcial)
  const matchesConvocatoria = React.useCallback(
    (evt: Concert | Rehearsal) => {
      if (evt.convocatoria_tipo === 'parcial' && evt.convocados_ids && evt.convocados_ids.length > 0) {
        if (currentUser) {
          const uId = currentUser.id;
          const uEmail = (currentUser.email || '').toLowerCase().trim();
          const uUsername = (currentUser.username || '').toLowerCase().trim();

          const isSummoned = evt.convocados_ids.some((id) => {
            if (!id) return false;
            if (id === uId) return true;
            // Also check if id format contains username/email or part of user id
            const cleanEvtId = id.toLowerCase().trim();
            if (uEmail && cleanEvtId === uEmail) return true;
            if (uUsername && cleanEvtId === uUsername) return true;
            if (uId && (cleanEvtId.includes(uId) || uId.includes(cleanEvtId))) return true;
            return false;
          });

          const isLeader = currentUser.role === 'leader';
          return isSummoned || isLeader;
        }
      }
      return true; //'completa' or omitted -> visible to all
    },
    [currentUser]
  );

  return { matchesConvocatoria, setSelectedBandIdForNewEvent, effectiveBandMembers, selectedBandIdForNewEvent };
}
