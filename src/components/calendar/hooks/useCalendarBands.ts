/**
 * Bandas visibles, identidad (color/logo) y filtro por banda.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { useState } from "react";
import { Concert, Rehearsal } from "../../../types";
import type { BandTaggedEvent, CalendarBand, CalendarUser } from "../calendarTypes";
import { BAND_COLOR_PALETTES } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarBandsParams {
  currentBandId: string;
  currentBandName: string;
  currentBandLogo: string;
  availableBands: CalendarBand[];
  concerts: Concert[];
  rehearsals: Rehearsal[];
  currentUser?: CalendarUser;
}

/**
 * Bandas visibles, identidad (color/logo) y filtro por banda.
 * @param params Estado y callbacks del contenedor ({@link CalendarBandsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarBands({ currentBandId, currentBandName, currentBandLogo, availableBands, concerts, rehearsals, currentUser }: CalendarBandsParams) {
  // Band view filter state:'all' (Todas las bandas asignadas por defecto) vs'active' (Solo la banda activa)
  const [filterBandMode, setFilterBandMode] = useState<'active' | 'all'>('all');

  const activeBandId = currentBandId;

  const activeBandName = currentBandName;

  // Helper to compare band IDs normalizing prefixes (e.g.,'band-' vs'reg-')
  const isSameBandId = React.useCallback((id1?: string, id2?: string) => {
    if (!id1 && !id2) return true;
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    const clean1 = id1
      .replace(/^(band|reg)-/, '')
      .trim()
      .toLowerCase();
    const clean2 = id2
      .replace(/^(band|reg)-/, '')
      .trim()
      .toLowerCase();
    return clean1 === clean2;
  }, []);

  // Build list of all user's assigned bands with logo resolution
  const effectiveBandsList = React.useMemo(() => {
    const map = new Map<string, CalendarBand>();

    let customLogos: Record<string, string> = {};
    try {
      const raw = localStorage.getItem('bandmanager_custom_band_logos');
      if (raw) customLogos = JSON.parse(raw);
    } catch {
      // Sin localStorage o JSON inválido: se usan los logos de la API.
    }

    const addBandToMap = (id?: string, name?: string, logo?: string) => {
      if (!id) return;
      const cleanKey = id
        .replace(/^(band|reg)-/, '')
        .trim()
        .toLowerCase();

      let resolvedLogo = logo || customLogos[cleanKey] || '';
      if (!resolvedLogo && isSameBandId(id, activeBandId) && currentBandLogo) {
        resolvedLogo = currentBandLogo;
      }

      if (!map.has(cleanKey)) {
        const displayName =
          name || cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
        map.set(cleanKey, {
          band_id: id,
          bandName: displayName,
          logoUrl: resolvedLogo,
        });
      } else {
        const existing = map.get(cleanKey)!;
        if (resolvedLogo && !existing.logoUrl) existing.logoUrl = resolvedLogo;
        if (name && existing.bandName === cleanKey) existing.bandName = name;
      }
    };

    if (activeBandId) {
      addBandToMap(activeBandId, activeBandName, currentBandLogo);
    }

    if (availableBands && availableBands.length > 0) {
      availableBands.forEach((b) => {
        const id = b.band_id || b.id;
        const name = b.bandName || b.name || b.nombre_banda;
        const logo = b.logoUrl || b.logo_url || b.imagen_url || b.avatar_url;
        addBandToMap(id, name, logo);
      });
    }

    concerts.forEach((c: Concert & BandTaggedEvent) => {
      if (c.band_id) {
        addBandToMap(c.band_id, c.bandName, c.bandLogo || c.logoUrl);
      }
    });

    rehearsals.forEach((r: Rehearsal & BandTaggedEvent) => {
      if (r.band_id) {
        addBandToMap(r.band_id, r.bandName, r.bandLogo || r.logoUrl);
      }
    });

    return Array.from(map.values());
  }, [activeBandId, activeBandName, currentBandLogo, availableBands, concerts, rehearsals, isSameBandId]);

  // Helper to accurately derive the band name for any concert or rehearsal event
  const getEventBandName = React.useCallback(
    (e: { bandName?: string; band_id?: string } | null | undefined): string => {
      if (!e) return activeBandName || 'Tu Banda';
      if (e.bandName) return e.bandName;
      if (e.band_id) {
        const found = effectiveBandsList.find((b) => isSameBandId(b.band_id, e.band_id));
        if (found?.bandName) return found.bandName;
        if (e.band_id.startsWith('band-') || e.band_id.startsWith('reg-')) {
          const slug = e.band_id.replace(/^(band|reg)-/, '');
          return slug.charAt(0).toUpperCase() + slug.slice(1);
        }
      }
      return activeBandName || 'Tu Banda';
    },
    [effectiveBandsList, activeBandName, isSameBandId]
  );

  const getBandIdentity = React.useCallback(
    (bandId?: string, bandNameFallback?: string) => {
      const name = getEventBandName({ band_id: bandId, bandName: bandNameFallback });
      const cleanId = (bandId || '')
        .replace(/^(band|reg)-/, '')
        .trim()
        .toLowerCase();
      const cleanName = (name || '').trim().toLowerCase();

      const found = effectiveBandsList.find((b) => isSameBandId(b.band_id, bandId));
      let logoUrl = found?.logoUrl || found?.logo_url || found?.imagen_url || found?.avatar_url || '';

      if (!logoUrl && availableBands && availableBands.length > 0) {
        const match = availableBands.find((b) => isSameBandId(b.band_id, bandId) || isSameBandId(b.id, bandId));
        if (match) {
          logoUrl = match.logoUrl || match.logo_url || match.imagen_url || match.avatar_url || '';
        }
      }

      if (!logoUrl) {
        try {
          const raw = localStorage.getItem('bandmanager_custom_band_logos');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed[cleanId]) logoUrl = parsed[cleanId];
          }
        } catch {
          // Logos personalizados ilegibles: se ignoran.
        }
      }

      if (!logoUrl && (isSameBandId(activeBandId, bandId) || cleanName === activeBandName?.trim().toLowerCase())) {
        logoUrl = currentBandLogo || '';
      }


      const words = name.trim().split(/\s+/).filter(Boolean);
      const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();

      let hash = 0;
      const str = bandId || name || 'band';
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      }
      const palette = BAND_COLOR_PALETTES[hash % BAND_COLOR_PALETTES.length];

      return { name, initials, logoUrl, palette };
    },
    [effectiveBandsList, getEventBandName, isSameBandId, availableBands, activeBandId, activeBandName, currentBandLogo]
  );

  // Check if current user is in multiple bands or has access to multiple bands' events
  const isMultiBandUser =
    effectiveBandsList.length > 1 ||
    (availableBands && availableBands.length > 1) ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'leader' ||
    currentUser?.is_admin ||
    concerts.some((c) => c.band_id && !isSameBandId(c.band_id, activeBandId)) ||
    rehearsals.some((r) => r.band_id && !isSameBandId(r.band_id, activeBandId));

  return { activeBandId, effectiveBandsList, filterBandMode, isSameBandId, getEventBandName, activeBandName, getBandIdentity, isMultiBandUser, setFilterBandMode };
}
