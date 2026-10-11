/**
 * Orden del show y equipamiento del día seleccionado, sincronizados con el servidor.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Concert, Rehearsal } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { GearItem, RunOfShowItem } from "../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RunOfShowAndGearParams {
  showEventFichaModal: boolean;
  setSelectedEventId: Dispatch<SetStateAction<string>>;
  initialSelectedEventId: string;
  filteredConcerts: Concert[];
  selectedDateKey: string;
  filteredRehearsals: Rehearsal[];
  currentBandId: string;
}

/**
 * Orden del show y equipamiento del día seleccionado, sincronizados con el servidor.
 * @param params Estado y callbacks del contenedor ({@link RunOfShowAndGearParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRunOfShowAndGear({ showEventFichaModal, setSelectedEventId, initialSelectedEventId, filteredConcerts, selectedDateKey, filteredRehearsals, currentBandId }: RunOfShowAndGearParams) {
  // Al cambiar de día, olvidar qué evento estaba elegido: si no, un día con un solo evento podía
  // heredar el id de otro día y no encontrar coincidencia (se ve el primero, que es el
  // Al cambiar la fecha seleccionada en la cuadrícula, reseteamos el id de evento activo solo si la Ficha Modal
  // no está abierta y si el evento anterior no pertenecía al nuevo día seleccionado.
  useEffect(() => {
    if (showEventFichaModal) return;
    setSelectedEventId((prev) => {
      if (!prev) return null;
      if (initialSelectedEventId && prev === initialSelectedEventId) return prev;
      const belongsToNewDate =
        filteredConcerts.some((c) => c.id === prev && c.fecha === selectedDateKey) ||
        filteredRehearsals.some((r) => r.id === prev && r.fecha === selectedDateKey);
      return belongsToNewDate ? prev : null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, showEventFichaModal]);

  const [allRunOfShow, setAllRunOfShow] = useState<Record<string, RunOfShowItem[]>>({});

  const [allGear, setAllGear] = useState<Record<string, GearItem[]>>({});

  // Fetch server logistics state on mount
  useEffect(() => {
    if (!currentBandId) return;
    apiFetch<{ runOfShow?: Record<string, RunOfShowItem[]>; gearChecklists?: Record<string, GearItem[]> }>(`/api/logistics?band_id=${encodeURIComponent(currentBandId)}`)
      .then((data) => {
        if (data) {
          if (data.runOfShow && Object.keys(data.runOfShow).length > 0) {
            setAllRunOfShow((prev) => ({ ...prev, ...data.runOfShow }));
          }
          if (data.gearChecklists && Object.keys(data.gearChecklists).length > 0) {
            setAllGear((prev) => ({ ...prev, ...data.gearChecklists }));
          }
        }
      })
      .catch((err) => console.warn('Notice: using local logistics state:', err));
  }, [currentBandId]);

  // Sync helpers to post server state
  const saveRunOfShowToServer = (dateKey: string, items: RunOfShowItem[]) => {
    apiFetch('/api/logistics/runofshow', {
      method: 'POST',
      body: JSON.stringify({ dateKey, items }),
    }).catch((err) => console.error('Error saving run of show:', err));
  };

  const saveGearToServer = (dateKey: string, items: GearItem[]) => {
    apiFetch('/api/logistics/gear', {
      method: 'POST',
      body: JSON.stringify({ dateKey, items }),
    }).catch((err) => console.error('Error saving gear checklist:', err));
  };

  // Inputs for adding new items
  const [newRunTime, setNewRunTime] = useState('');

  const [newRunActivity, setNewRunActivity] = useState('');

  const [newGearLabel, setNewGearLabel] = useState('');

  // NOTE: Removed localStorage persistence of run_of_show and gear_checklists.
  // These are now session-local state (reset on band change or page reload).
  // For persistence: aggregate to Supabase with band_id validation via API.
  // Storing band data in localStorage without band_id scope violates multi-tenancy.

  // Current items for the selected day
  const currentRunOfShow = allRunOfShow[selectedDateKey] || [
    {
      id: 'ros-def-1',
      time: '17:00',
      activity: 'Llegada y descarga',
      done: false,
    },
    {
      id: 'ros-def-2',
      time: '18:00',
      activity: 'Prueba de sonido',
      done: false,
    },
    {
      id: 'ros-def-3',
      time: '21:00',
      activity: 'Comienzo de actuación / actividad',
      done: false,
    },
  ];

  const currentGear = allGear[selectedDateKey] || [
    {
      id: 'gear-def-1',
      label: 'Instrumentos principales y fundas',
      checked: false,
    },
    { id: 'gear-def-2', label: 'In-Ears y receptores', checked: false },
    {
      id: 'gear-def-3',
      label: 'Cables de audio y alimentación',
      checked: false,
    },
  ];

  const handleToggleRunOfShow = (id: string) => {
    setAllRunOfShow((prev) => {
      const dayList = prev[selectedDateKey] || currentRunOfShow;
      const updatedList = dayList.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
      saveRunOfShowToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
  };

  const handleAddRunOfShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunActivity.trim()) return;
    const timeVal = newRunTime.trim() || '12:00';
    const newItem: RunOfShowItem = {
      id: `ros-${Date.now()}`,
      time: timeVal,
      activity: newRunActivity.trim(),
      done: false,
    };
    setAllRunOfShow((prev) => {
      const dayList = prev[selectedDateKey] || currentRunOfShow;
      const updatedList = [...dayList, newItem];
      saveRunOfShowToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
    setNewRunTime('');
    setNewRunActivity('');
  };

  const handleDeleteRunOfShow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllRunOfShow((prev) => {
      const dayList = prev[selectedDateKey] || currentRunOfShow;
      const updatedList = dayList.filter((item) => item.id !== id);
      saveRunOfShowToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
  };

  const handleToggleGear = (id: string) => {
    setAllGear((prev) => {
      const dayList = prev[selectedDateKey] || currentGear;
      const updatedList = dayList.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      saveGearToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearLabel.trim()) return;
    const newItem: GearItem = {
      id: `gear-${Date.now()}`,
      label: newGearLabel.trim(),
      checked: false,
    };
    setAllGear((prev) => {
      const dayList = prev[selectedDateKey] || currentGear;
      const updatedList = [...dayList, newItem];
      saveGearToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
    setNewGearLabel('');
  };

  const handleDeleteGear = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllGear((prev) => {
      const dayList = prev[selectedDateKey] || currentGear;
      const updatedList = dayList.filter((item) => item.id !== id);
      saveGearToServer(selectedDateKey, updatedList);
      return {
        ...prev,
        [selectedDateKey]: updatedList,
      };
    });
  };

  return { currentRunOfShow, currentGear, handleToggleRunOfShow, handleAddRunOfShow, handleDeleteRunOfShow, handleToggleGear, handleAddGear, handleDeleteGear, newRunTime, setNewRunTime, newRunActivity, setNewRunActivity, newGearLabel, setNewGearLabel };
}
