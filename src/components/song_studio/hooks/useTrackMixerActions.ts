/**
 * Acciones del mezclador sobre las pistas de una idea: volumen, desfase, mute/solo, paneo, EQ, exportar mezcla, renombrar, borrar, reordenar y arrastrar
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { SongAudioIdea, AudioTrack, Song } from "../../../types";
import { cancionConMezcla } from "../../../utils/ideaDeAtril";
import { getIdeaTracks } from "../ideaTracks";
import { exportMasterMixAudioBlob } from "../../../utils/audioLatency";
import { resolveAudioUrl } from "../../../utils/audioStorage";
import { cancionConPistas } from "../../../utils/irisTracks";
import { RAINBOW_HUE_STEPS } from "../trackColors";
import { useState, RefObject, Dispatch, SetStateAction, type MouseEvent } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface TrackMixerActionsParams {
  pistasDeReproduccion: (idea: SongAudioIdea) => AudioTrack[];
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  updateTrackAudioDSP: (trackId: string, el: HTMLAudioElement, tr: { volumen?: number; muted?: boolean; solo?: boolean; eqLow?: number; eqMid?: number; eqHigh?: number; pan?: number; instrumento?: string; nombre?: string; audioUrl?: string; }, hasSoloInSession?: boolean) => void;
  song: Song;
  songRef: RefObject<Song>;
  onUpdateSong: (updatedSong: Song) => void;
  currentTimeMap: Record<string, number>;
  setIsExportingMaster: Dispatch<SetStateAction<boolean>>;
  resolvedAudioUrls: Record<string, string>;
  setEditingTrackId: Dispatch<SetStateAction<string>>;
  setConfirmDeleteModal: Dispatch<SetStateAction<{ title: string; description: string; onConfirm: () => void; }>>;
  handleDeleteIdea: (e?: MouseEvent, ideaId?: string, skipModal?: boolean) => void;
}

/**
 * Acciones del mezclador sobre las pistas de una idea: volumen, desfase, mute/solo, paneo, EQ, exportar mezcla, renombrar, borrar, reordenar y arrastrar
 * @param params Estado y callbacks del contenedor ({@link TrackMixerActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTrackMixerActions({ pistasDeReproduccion, trackAudioRefs, updateTrackAudioDSP, song, songRef, onUpdateSong, currentTimeMap, setIsExportingMaster, resolvedAudioUrls, setEditingTrackId, setConfirmDeleteModal, handleDeleteIdea }: TrackMixerActionsParams) {
  const handleTrackVolumeChange = (idea: SongAudioIdea, trackId: string, newVol: number) => {
    const tracks = pistasDeReproduccion(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, volumen: newVol } : tr));
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Latency Desfase Change (Nudge in ms)
  const handleTrackDesfaseChange = (idea: SongAudioIdea, trackId: string, newDesfaseMs: number) => {
    const tracks = pistasDeReproduccion(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, desfaseMs: newDesfaseMs } : tr));

    // Immediately adjust active element currentTime if currently playing
    const el = trackAudioRefs.current[trackId];
    if (el) {
      const masterTime = currentTimeMap[idea.id] || 0;
      const targetTime = Math.max(0, masterTime + newDesfaseMs / 1000);
      try {
        el.currentTime = targetTime;
      } catch {}
    }

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Mute Toggle
  const handleToggleMuteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = pistasDeReproduccion(idea);
    const updatedTracks = tracks.map((tr) => {
      if (tr.id !== trackId) return tr;
      const nextMuted = !tr.muted;
      return {
        ...tr,
        muted: nextMuted,
        solo: nextMuted ? false : tr.solo, // Mutually exclusive: turning Mute ON turns Solo OFF
      };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Solo Toggle (Cubase style: Exclusive Solo)
  const handleToggleSoloTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = pistasDeReproduccion(idea);
    const targetTrack = tracks.find((t) => t.id === trackId);
    const isTargetCurrentlySolo = !!targetTrack?.solo;

    const updatedTracks = tracks.map((tr) => {
      if (tr.id === trackId) {
        const nextSolo = !isTargetCurrentlySolo;
        return {
          ...tr,
          solo: nextSolo,
          muted: nextSolo ? false : tr.muted, // Turning Solo ON turns Mute OFF
        };
      }
      // Exclusive Solo: turning solo ON for 1 track turns solo OFF for all other tracks
      return {
        ...tr,
        solo: false,
      };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track Pan Change (-1 to 1)
  const handleTrackPanChange = (idea: SongAudioIdea, trackId: string, pan: number) => {
    const tracks = pistasDeReproduccion(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, pan } : tr));
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Track EQ Change (low, mid, high: -12dB to +12dB)
  const handleTrackEqChange = (idea: SongAudioIdea, trackId: string, band: 'low' | 'mid' | 'high', value: number) => {
    const tracks = pistasDeReproduccion(idea);
    const updatedTracks = tracks.map((tr) => {
      if (tr.id !== trackId) return tr;
      if (band === 'low') return { ...tr, eqLow: value };
      if (band === 'mid') return { ...tr, eqMid: value };
      return { ...tr, eqHigh: value };
    });
    const hasSolo = updatedTracks.some((t) => t.solo);

    updatedTracks.forEach((tr) => {
      const el = trackAudioRefs.current[tr.id];
      if (el) {
        updateTrackAudioDSP(tr.id, el, tr, hasSolo);
      }
    });

    const updatedSong = cancionConMezcla(song, idea, updatedTracks);
    songRef.current = updatedSong;
    onUpdateSong(updatedSong);
  };

  // Handle Export Master Mix WAV
  const handleExportMasterMix = async (idea: SongAudioIdea) => {
    const tracks = getIdeaTracks(idea);
    if (!tracks || tracks.length === 0) {
      alert('No hay pistas registradas en esta sección para exportar.');
      return;
    }

    setIsExportingMaster(true);
    try {
      const tracksToMix = tracks.map((tr) => ({
        audioUrl: resolvedAudioUrls[tr.id] || tr.audioUrl,
        volumen: tr.volumen ?? 1,
        pan: tr.pan ?? 0,
        muted: tr.muted ?? false,
        solo: tr.solo ?? false,
        desfaseMs: tr.desfaseMs ?? 0,
        eqLow: tr.eqLow ?? 0,
        eqMid: tr.eqMid ?? 0,
        eqHigh: tr.eqHigh ?? 0,
      }));

      const wavBlob = await exportMasterMixAudioBlob(tracksToMix, resolveAudioUrl);
      const downloadUrl = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeTitle = (idea.titulo || 'mezcla_master').toLowerCase().replace(/\s+/g, '_');
      link.download = `${song.titulo || 'cancion'}_${safeTitle}_master.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err: any) {
      console.error('Error al exportar la mezcla máster:', err);
      alert('No se pudo exportar la mezcla máster: ' + (err.message || err));
    } finally {
      setIsExportingMaster(false);
    }
  };

  // Rename track
  const handleSaveTrackName = (idea: SongAudioIdea, trackId: string, newName: string) => {
    if (!newName.trim()) return;
    const tracks = getIdeaTracks(idea);
    const updatedTracks = tracks.map((tr) => (tr.id === trackId ? { ...tr, nombre: newName.trim() } : tr));
    onUpdateSong(cancionConPistas(song, idea, updatedTracks));
    setEditingTrackId(null);
  };

  // Delete track from idea (shows custom confirmation modal)
  const handleDeleteTrack = (idea: SongAudioIdea, trackId: string) => {
    const tracks = getIdeaTracks(idea);
    const track = tracks.find((t) => t.id === trackId);

    if (tracks.length <= 1) {
      setConfirmDeleteModal({
        title: 'Eliminar Idea Completa',
        description: `Esta pista es la única de la idea "${idea.titulo}". ¿Deseas eliminar la idea completa del tema?`,
        onConfirm: () => {
          handleDeleteIdea(undefined, idea.id, true);
        },
      });
      return;
    }

    setConfirmDeleteModal({
      title: 'Eliminar Pista de Audio',
      description: `¿Deseas eliminar la pista "${track?.nombre || 'Pista'}" de la mezcla de "${idea.titulo}"?`,
      onConfirm: () => {
        const el = trackAudioRefs.current[trackId];
        if (el) el.pause();

        const updatedTracks = tracks.filter((tr) => tr.id !== trackId);
        onUpdateSong(cancionConPistas(song, idea, updatedTracks, { audioUrl: updatedTracks[0]?.audioUrl || idea.audioUrl }));
      },
    });
  };

  // Reordenar pistas a mano (guiño a Iris: al mover, cada pista"congela" su color de arcoíris
  // actual en colorHue para que se lo lleve consigo — a partir de ahí el orden visual del
  // arcoíris ya no será perfecto, pero cada pista mantiene su identidad de color).
  const stampTrackColors = (tracks: AudioTrack[]): AudioTrack[] =>
    tracks.map((t, i) => ({
      ...t,
      colorHue: typeof t.colorHue === 'number' ? t.colorHue : RAINBOW_HUE_STEPS[i % RAINBOW_HUE_STEPS.length],
    }));

  const reorderIdeaTracks = (idea: SongAudioIdea, fromIndex: number, toIndex: number) => {
    const tracks = getIdeaTracks(idea);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= tracks.length || fromIndex === toIndex) return;

    const reordered = stampTrackColors(tracks);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onUpdateSong(cancionConPistas(song, idea, reordered));
  };

  const handleMoveTrack = (idea: SongAudioIdea, trackId: string, direction: 'up' | 'down') => {
    const tracks = getIdeaTracks(idea);
    const fromIndex = tracks.findIndex((t) => t.id === trackId);
    reorderIdeaTracks(idea, fromIndex, direction === 'up' ? fromIndex - 1 : fromIndex + 1);
  };

  // Arrastrar y soltar para reordenar pistas — mismo sistema (handle GripVertical + HTML5 drag)
  // que ya usa el repertorio para reordenar canciones y setlists.
  const [draggedTrackInfo, setDraggedTrackInfo] = useState<{
    ideaId: string;
    index: number;
  } | null>(null);
  const [dragOverTrackIndex, setDragOverTrackIndex] = useState<number | null>(null);

  const handleDropTrack = (idea: SongAudioIdea, dropIndex: number) => {
    if (draggedTrackInfo && draggedTrackInfo.ideaId === idea.id) {
      reorderIdeaTracks(idea, draggedTrackInfo.index, dropIndex);
    }
    setDraggedTrackInfo(null);
    setDragOverTrackIndex(null);
  };

  return { handleToggleMuteTrack, handleToggleSoloTrack, handleTrackDesfaseChange, handleExportMasterMix, draggedTrackInfo, dragOverTrackIndex, setDragOverTrackIndex, handleDropTrack, setDraggedTrackInfo, handleSaveTrackName, handleTrackVolumeChange, handleTrackPanChange, handleTrackEqChange, handleMoveTrack, handleDeleteTrack };
}
