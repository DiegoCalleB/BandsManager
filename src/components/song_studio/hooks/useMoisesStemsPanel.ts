/**
 * Estado del panel de Iris/Moisés: motor, preset, stems elegidos, pestaña y apertura automática desde el atajo
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Song, SongAudioIdea } from "../../../types";
import { getSongIrisStemIdea } from "../../../utils/irisTracks";
import { MOISES_PRESETS_CONFIG, MoisesSeparationPreset } from "../moisesStems";
import { getSongMainAudioUrl } from "../songAudioSource";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MoisesStemsPanelParams {
  initialOpenIrisModal: boolean;
  song: Song;
  setExpandedIdeaIds: Dispatch<SetStateAction<Set<string>>>;
  currentUsername: string;
}

/**
 * Estado del panel de Iris/Moisés: motor, preset, stems elegidos, pestaña y apertura automática desde el atajo
 * @param params Estado y callbacks del contenedor ({@link MoisesStemsPanelParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMoisesStemsPanel({ initialOpenIrisModal, song, setExpandedIdeaIds, currentUsername }: MoisesStemsPanelParams) {
  // El selector de motor aún no existe en el modal: la separación usa siempre el motor por defecto.
  const selectedStemEngine: 'fal' | 'mvsep-mdx23' | 'demucs' | 'dsp-server' = 'fal';
  const [showMoisesStemsModal, setShowMoisesStemsModal] = useState<SongAudioIdea | null>(null);
  const [showIrisPanel, setShowIrisPanel] = useState(false);
  const [moisesTab, setMoisesTab] = useState<'stems' | 'how_it_works' | 'upload'>('stems');
  const [moisesPreset, setMoisesPreset] = useState<MoisesSeparationPreset>('6_stems');
  const [selectedStemsToExtract, setSelectedStemsToExtract] = useState<string[]>([
    'Voz',
    'Batería',
    'Bajo',
    'Guitarras',
    'Teclados',
    'Arreglos',
  ]);

  const handleSelectMoisesPreset = (preset: MoisesSeparationPreset) => {
    setMoisesPreset(preset);
    if (preset !== 'custom') {
      setSelectedStemsToExtract(MOISES_PRESETS_CONFIG[preset].stems);
    }
  };

  // Auto-abrir modal de separación de pistas con Iris al pulsar el acceso directo "Procesar con Iris"
  const atajoIrisAtendidoRef = useRef(false);
  useEffect(() => {
    // Solo la primera vez: con `song` en las dependencias, cada guardado reabría la idea.
    if (initialOpenIrisModal && !atajoIrisAtendidoRef.current) {
      atajoIrisAtendidoRef.current = true;
      // Atajo de un solo disparo (guardado por la ref): abre el selector de stems al montar.
      /* eslint-disable react-hooks/set-state-in-effect */
      const existingIrisIdea = getSongIrisStemIdea(song);
      if (existingIrisIdea) {
        // La canción YA tiene pistas separadas: asegurar que quede expandida en el mezclador multipista
        // de inmediato para que el usuario vea todos los canales (Voz, Batería, Bajo, Guitarras...)
        setExpandedIdeaIds((prev) => new Set([...prev, existingIrisIdea.id]));
        setShowMoisesStemsModal(null);
      } else if (song.audioIdeas && song.audioIdeas.length > 0) {
        setShowMoisesStemsModal(song.audioIdeas[0]);
      } else {
        const fallbackIdea: SongAudioIdea = {
          id: `idea-main-${song.id || Date.now()}`,
          titulo: `Maqueta Principal (${song.titulo})`,
          audioUrl: getSongMainAudioUrl(song),
          subidoPor: currentUsername || 'Banda',
          seccion: 'general',
          fecha: new Date().toLocaleDateString('es-ES'),
        };
        setShowMoisesStemsModal(fallbackIdea);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [initialOpenIrisModal, song, currentUsername, setExpandedIdeaIds]);

  return { selectedStemEngine, selectedStemsToExtract, setShowMoisesStemsModal, setShowIrisPanel, showIrisPanel, showMoisesStemsModal, moisesTab, setMoisesTab, moisesPreset, handleSelectMoisesPreset };
}
