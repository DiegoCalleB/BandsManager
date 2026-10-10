/**
 * Modal de sincronización y URL del feed iCal de la banda.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { getErrorMessage } from "../../../utils/errorMessage";
import React, { useEffect, useState } from "react";
import { api } from "../../../services/api";
import type { CalendarBand } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarFeedParams {
  effectiveBandsList: CalendarBand[];
  activeBandId: string;
}

/**
 * Modal de sincronización y URL del feed iCal de la banda.
 * @param params Estado y callbacks del contenedor ({@link CalendarFeedParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarFeed({ effectiveBandsList, activeBandId }: CalendarFeedParams) {
  const [showSyncModal, setShowSyncModal] = useState(false);

  const [showCalMoreMenu, setShowCalMoreMenu] = useState(false);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const [syncScope] = useState<'all' | 'active'>('all');

  // La URL del feed .ics la firma el servidor: el enlace lleva una firma para que no baste con
  // saber el band_id para leerse los conciertos y ensayos de una banda cualquiera.
  const [rutaFeed, setRutaFeed] = useState<string | null>(null);

  const [, setErrorFeed] = useState<string | null>(null);

  const bandasDelFeed = React.useMemo(
    () => (syncScope === 'all' && effectiveBandsList.length > 1 ? effectiveBandsList.map((b) => b.band_id).join(',') : activeBandId || ''),
    [syncScope, effectiveBandsList, activeBandId]
  );

  useEffect(() => {
    if (!showSyncModal || !bandasDelFeed) return;
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el error previo al regenerar el enlace del feed
    setErrorFeed(null);
    api
      .getCalendarFeedUrl(bandasDelFeed)
      .then((res) => {
        if (cancelado) return;
        if (res.path) setRutaFeed(res.path);
        else setErrorFeed(res.error || 'No se pudo generar el enlace del calendario.');
      })
      .catch((err) => {
        if (!cancelado) setErrorFeed(getErrorMessage(err, 'No se pudo generar el enlace del calendario.'));
      });
    return () => {
      cancelado = true;
    };
  }, [showSyncModal, bandasDelFeed]);

  const host = typeof window !== 'undefined' ? window.location.origin : 'https://bandmanager.io';

  const urlFeedAbsoluta = rutaFeed ? `${host}${rutaFeed}` : '';

  const webCalFeed = urlFeedAbsoluta ? urlFeedAbsoluta.replace(/^https?:\/\//i, 'webcal://') : '';

  return { setShowSyncModal, showMobileSearch, setShowMobileSearch, setShowCalMoreMenu, showCalMoreMenu, showSyncModal, host, webCalFeed, rutaFeed };
}
