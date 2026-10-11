/**
 * Estado local y datos derivados de la ficha de evento: navegación cronológica, menús, formularios y hoja de ruta.
 * Extraído de CalendarEventDetailModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useCallback,useMemo,useState } from "react";
import { WeatherAlert } from "../../../../services/weatherService";
import { Concert,Rehearsal } from "../../../../types";
import { BandIdentity, BandTaggedEvent, ChronologicalEvent, RoadbookInfo } from "../../calendarTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EventDetailControllerParams {
  modalWeatherAlerts: WeatherAlert[];
  currentEventIndex: number;
  handleNavigateChronologicalEvent: (direction: "prev" | "next") => void;
  selectedConcert: Concert;
  selectedRehearsal: Rehearsal;
  selectedDateKey: string;
  getBandIdentity: (bandId?: string, fallbackName?: string) => BandIdentity;
  allChronologicalEvents: ChronologicalEvent[];
  deletingEventConfirmId: string;
  getCurrentRoadbook: (dateKey: string, concert?: Concert) => RoadbookInfo;
}

/**
 * Estado local y datos derivados de la ficha de evento: navegación cronológica, menús, formularios y hoja de ruta.
 * @param params Estado y callbacks del contenedor ({@link EventDetailControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventDetailController({ modalWeatherAlerts, currentEventIndex, handleNavigateChronologicalEvent, selectedConcert, selectedRehearsal, selectedDateKey, getBandIdentity, allChronologicalEvents, deletingEventConfirmId, getCurrentRoadbook }: EventDetailControllerParams) {
  const handleModalTouchStart = () => {};
  const handleModalTouchMove = () => {};
  const handleModalTouchEnd = () => {};

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
  const textTitle = 'text-[var(--ink)]';
  const textSub = 'text-[var(--ink-2)]';

  const [showFichaMenu, setShowFichaMenu] = useState(false);
  const [showPromocion, setShowPromocion] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactTelefono, setNewContactTelefono] = useState('');
  const [newContactNotas, setNewContactNotas] = useState('');

  const [showAddMerchForm, setShowAddMerchForm] = useState(false);
  const [merchCopiedToast] = useState(false);
  const [newMerchCategoria, setNewMerchCategoria] = useState<'camisetas' | 'vinilos' | 'musica' | 'accesorios' | 'otro'>('camisetas');
  const [newMerchStockInicial, setNewMerchStockInicial] = useState<number>(0);
  const [copiedEventModalId] = useState<string | null>(null);
  const [, setModalWeatherAlertsState] = useState<WeatherAlert[]>(modalWeatherAlerts || []);

  const activeChronoIndex = currentEventIndex;

  const goToAdjacentEvent = useCallback(
    (direction: 1 | -1) => {
      handleNavigateChronologicalEvent(direction === 1 ? 'next' : 'prev');
    },
    [handleNavigateChronologicalEvent]
  );

  const selectedEventTitle = selectedConcert
    ? `${selectedConcert.sala}${selectedConcert.ciudad ? ` (${selectedConcert.ciudad})` : ''}`
    : selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Ensayo';

  const selectedEventDetails = useMemo(() => {
    if (selectedConcert) {
      return {
        type: 'concert',
        time: (selectedConcert as Concert & { hora?: string }).hora || '21:30',
        lugar: selectedConcert.sala,
        direccion: selectedConcert.direccion || '',
        locationQuery: selectedConcert.direccion ? `${selectedConcert.sala}, ${selectedConcert.direccion}` : selectedConcert.sala,
        fee: selectedConcert.cache ? `${selectedConcert.cache} €` : 'A convenir',
        entradasUrl: selectedConcert.entradasUrl,
        entradasLugarFisico: selectedConcert.entradasLugarFisico,
        notes: selectedConcert.notas,
      };
    } else if (selectedRehearsal) {
      return {
        type: 'rehearsal',
        time: selectedRehearsal.hora || '20:00',
        lugar: selectedRehearsal.lugar || 'Local de Ensayo',
        direccion: selectedRehearsal.lugar || '',
        locationQuery: selectedRehearsal.lugar || 'Local de Ensayo',
        fee: 'N/A',
        notes: selectedRehearsal.notas,
      };
    }
    return { type: 'free', time: '', lugar: '', direccion: '', locationQuery: '', fee: '', notes: '' };
  }, [selectedConcert, selectedRehearsal]);

  const selectedDate = useMemo(() => {
    const dStr = selectedConcert?.fecha || selectedRehearsal?.fecha || selectedDateKey;
    return dStr ? new Date(dStr) : new Date();
  }, [selectedConcert, selectedRehearsal, selectedDateKey]);

  const [newCierreItemCat, setNewCierreItemCat] = React.useState<'escenario' | 'camerino' | 'furgoneta'>('escenario');
  const [newCierreItemText, setNewCierreItemText] = React.useState('');

  const modalEvent = selectedConcert || selectedRehearsal;
  const isConcert = !!selectedConcert;
  const modalBandInfo = getBandIdentity(modalEvent?.band_id, (modalEvent as BandTaggedEvent | null)?.bandName || (modalEvent as BandTaggedEvent | null)?.band_name);
  const modalPosLabel =
    allChronologicalEvents.length > 0 ? `${activeChronoIndex >= 0 ? activeChronoIndex + 1 : 1} de ${allChronologicalEvents.length}` : '';
  const eventCity =
    selectedConcert?.ciudad ||
    (selectedRehearsal?.lugar?.includes(',') ? selectedRehearsal.lugar.split(',').pop()?.trim() : '') ||
    (selectedRehearsal && !selectedRehearsal.lugar?.toLowerCase().includes('online') ? selectedRehearsal.lugar : '') ||
    '';
  const eventDateStr = modalEvent ? modalEvent.fecha.split('T')[0] : '';
  const eventTimeStr = selectedConcert ? '21:30' : selectedRehearsal?.hora || '20:00';
  const isConfirmingDelete = deletingEventConfirmId === modalEvent?.id;
  const modalRoadbookKey = eventDateStr || selectedDateKey;
  const modalRoadbook = getCurrentRoadbook(modalRoadbookKey, selectedConcert);

  return { handleModalTouchStart, handleModalTouchMove, handleModalTouchEnd, goToAdjacentEvent, activeChronoIndex, modalPosLabel, modalBandInfo, textTitle, selectedEventTitle, textSub, selectedDate, monthNames, modalEvent, isConcert, setShowPromocion, setShowFichaMenu, showFichaMenu, copiedEventModalId, showPromocion, isConfirmingDelete, eventCity, eventDateStr, eventTimeStr, setModalWeatherAlertsState, modalRoadbook, selectedEventDetails, modalRoadbookKey, setShowAddContactForm, showAddContactForm, newContactTelefono, setNewContactTelefono, newContactNotas, setNewContactNotas, merchCopiedToast, setShowAddMerchForm, showAddMerchForm, newMerchCategoria, setNewMerchCategoria, newMerchStockInicial, setNewMerchStockInicial, newCierreItemCat, setNewCierreItemCat, newCierreItemText, setNewCierreItemText };
}
