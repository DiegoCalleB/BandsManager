/**
 * Formularios de alta de reunión, ensayo y concierto.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import type { Setlist, Song } from "../../../types";
import { apiFetch } from "../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CreateEventFormParams {
  setSelectedBandIdForNewEvent: Dispatch<SetStateAction<string>>;
  activeBandId: string;
  setConvocatoriaTipo: Dispatch<SetStateAction<"completa" | "parcial">>;
  setConvocadosIds: Dispatch<SetStateAction<string[]>>;
  effectiveBandMembers: { id: string; name: string; role: string; }[];
}

/**
 * Formularios de alta de reunión, ensayo y concierto.
 * @param params Estado y callbacks del contenedor ({@link CreateEventFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCreateEventForm({ setSelectedBandIdForNewEvent, activeBandId, setConvocatoriaTipo, setConvocadosIds, effectiveBandMembers }: CreateEventFormParams) {
  const [activeTab, setActiveTab] = useState<'runofshow' | 'tecnica' | 'contactos' | 'merchan' | 'cierre' | 'gear' | 'roadbook'>(
    'runofshow'
  );

  const [modalActiveTab, setModalActiveTab] = useState<'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre'>('resumen');

  // Creation Modals state
  const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | 'reunion' | null>(null);

  const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

  // Form fields for new Reunion
  const [reuHora] = useState('19:30 - 20:30');

  const [reuLugar] = useState('Online (Google Meet)');

  const [reuAsunto] = useState('Coordinación de gira y tareas');

  const [reuEnlace] = useState('');

  const [reuNotas] = useState(
    '1. Repasar próximas fechas y logística.\n2. Presupuestos y gastos.\n3. Nuevos temas del repertorio.'
  );

  const [reuEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');

  // Reset convocatoria state when opening modal
  useEffect(() => {
    if (showCreateModal) {
      setSelectedBandIdForNewEvent(activeBandId);
      setConvocatoriaTipo('completa');
    }
  }, [showCreateModal, activeBandId, setSelectedBandIdForNewEvent, setConvocatoriaTipo]);

  useEffect(() => {
    if (showCreateModal) {
      setConvocadosIds(effectiveBandMembers.map((m) => m.id));
    }
  }, [showCreateModal, effectiveBandMembers, setConvocadosIds]);

  // Form fields for new Rehearsal
  const [rehTime] = useState('18:00 - 21:00');

  const [rehLugar] = useState('Locales de Ensayo');

  const [rehNotas] = useState('Ensayo general de repertorio directo');

  const [rehEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');

  const [rehSetlistId] = useState<string>('');

  // Form fields for new Concert
  const [concCiudad, setConcCiudad] = useState('Madrid');

  const [concSala] = useState('');

  const [concCache] = useState('1200');

  const [concAforo, setConcAforo] = useState('300');

  const [concContrato] = useState(true);

  const [concEstadoPago] = useState<'pendiente' | 'pagado' | 'anticipo'>('pendiente');

  const [concTipo] = useState<'propio' | 'festival' | 'privado'>('propio');

  const [concNotas, setConcNotas] = useState('Concierto agendado desde el calendario');

  const [concIdioma] = useState('');

  const [concSetlistId] = useState<string>('');

  const [concIsPosible, setConcIsPosible] = useState(false);

  // Setlists disponibles para ensayos y conciertos
  const [availableSetlists, setAvailableSetlists] = useState<Setlist[]>([]);

  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);

  // Load setlists & songs from API (validated by band_id server-side)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [setlistsRes, songsRes] = await Promise.all([
          apiFetch<{ setlists: Setlist[] }>('/api/repertorio/setlists').catch(() => null),
          apiFetch<{ songs: Song[] }>('/api/repertorio/songs').catch(() => null),
        ]);

        if (isMounted) {
          if (setlistsRes?.setlists && Array.isArray(setlistsRes.setlists)) {
            setAvailableSetlists(setlistsRes.setlists);
          }
          if (songsRes?.songs && Array.isArray(songsRes.songs)) {
            setAvailableSongs(songsRes.songs);
          }
        }
      } catch {
        if (isMounted) {
          setAvailableSetlists([]);
          setAvailableSongs([]);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeBandId]);

  return { rehTime, rehLugar, rehNotas, rehEstado, rehSetlistId, setShowCreateModal, reuHora, reuLugar, reuAsunto, reuEnlace, reuNotas, reuEstado, concCiudad, concSala, concCache, concAforo, concContrato, concEstadoPago, concNotas, concTipo, concIsPosible, concIdioma, concSetlistId, availableSetlists, setShowAddEventDropdown, showAddEventDropdown, setConcIsPosible, setModalActiveTab, setConcCiudad, setConcAforo, setConcNotas, activeTab, setActiveTab, showCreateModal, modalActiveTab, availableSongs };
}
