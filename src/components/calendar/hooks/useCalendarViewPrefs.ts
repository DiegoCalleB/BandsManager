/**
 * Preferencias de vista (meses, modo) por dispositivo, persistidas para el usuario.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useRef, useState } from "react";
import { CalendarMonthsView, detectDeviceType, DeviceType, getAllDevicePreferences, isTwoMonthsDefault, setCalendarDefaultMonths, syncCalendarPreferencesFromUser } from "../../../utils/calendarViewPreferences";
import type { CalendarUser } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarViewPrefsParams {
  currentUser?: CalendarUser;
}

/**
 * Preferencias de vista (meses, modo) por dispositivo, persistidas para el usuario.
 * @param params Estado y callbacks del contenedor ({@link CalendarViewPrefsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarViewPrefs({ currentUser }: CalendarViewPrefsParams) {
  // Configuración de vista de meses por tipo de dispositivo (1 mes por defecto para simplificación visual, configurable y sincronizado en Supabase)
  const currentDeviceType = detectDeviceType();

  const [devicePrefs, setDevicePrefs] = useState<{
    mobile: CalendarMonthsView;
    desktop: CalendarMonthsView;
  }>(() => getAllDevicePreferences());

  const [selectedConfigDevice, setSelectedConfigDevice] = useState<DeviceType>(() => detectDeviceType());

  const [, setTwoMonthsMode] = useState<boolean>(() => isTwoMonthsDefault());

  const [calendarViewMode, setCalendarViewMode] = useState<'1m' | '2m' | 'week' | 'agenda'>(() => (isTwoMonthsDefault() ? '2m' : '1m'));

  const [showViewConfigPopover, setShowViewConfigPopover] = useState<boolean>(false);

  const [configToast, setConfigToast] = useState<string | null>(null);

  const [isSavingPref, setIsSavingPref] = useState<boolean>(false);

  const viewConfigRef = useRef<HTMLDivElement>(null);

  // Sincronizar preferencias si el usuario se autentica o refresca sesión
  useEffect(() => {
    if (currentUser) {
      syncCalendarPreferencesFromUser(currentUser);
      const updated = getAllDevicePreferences();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza las preferencias del usuario recién cargado
      setDevicePrefs(updated);
      const curDev = detectDeviceType();
      const is2m = updated[curDev] === '2';
      setTwoMonthsMode(is2m);
      setCalendarViewMode((prev) => (prev === 'week' || prev === 'agenda' ? prev : is2m ? '2m' : '1m'));
    }
  }, [currentUser]);

  // Cerrar el menú de configuración de vista al hacer clic fuera o pulsar Escape
  useEffect(() => {
    if (!showViewConfigPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (viewConfigRef.current && !viewConfigRef.current.contains(e.target as Node)) {
        setShowViewConfigPopover(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowViewConfigPopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showViewConfigPopover]);

  const handleSetDefaultMonthsForDevice = async (mode: CalendarMonthsView, targetDevice: DeviceType) => {
    setIsSavingPref(true);
    setDevicePrefs((prev) => ({ ...prev, [targetDevice]: mode }));

    if (targetDevice === currentDeviceType) {
      setTwoMonthsMode(mode === '2');
      setCalendarViewMode(mode === '2' ? '2m' : '1m');
    }

    const isCloudSaved = await setCalendarDefaultMonths(mode, targetDevice, true);
    setIsSavingPref(false);

    const devLabel = targetDevice === 'mobile' ? 'móviles' : 'ordenadores';
    const modeLabel = mode === '1' ? '1 mes' : '2 meses';
    setConfigToast(
      isCloudSaved
        ? `Guardado en Supabase: ${modeLabel} por defecto para ${devLabel}`
        : `Guardado en local: ${modeLabel} por defecto para ${devLabel}`
    );

    setTimeout(() => {
      setConfigToast(null);
    }, 2200);
  };

  return { calendarViewMode, viewConfigRef, setCalendarViewMode, setTwoMonthsMode, devicePrefs, currentDeviceType, setShowViewConfigPopover, showViewConfigPopover, setSelectedConfigDevice, selectedConfigDevice, isSavingPref, handleSetDefaultMonthsForDevice, configToast };
}
