/**
 * CRUD de ideas de audio: guardar, crear, votar, borrar, duplicar y borrar comentarios
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
import { uploadFileToServer } from "../../../utils/audioStorage";
import { SECCIONES_TEMA } from "../studioConstants";
import { generateAccompanimentAudioBlob } from "../../../utils/accompanimentSynth";
import { AudioTrack, SongAudioIdea, Song, DrumPatternStyle } from "../../../types";
import { pistasDeCancion, cancionConIdeas } from "../../../utils/irisTracks";
import { ideaConPistasBase } from "../../../utils/ideaDeAtril";
import React, { Dispatch, SetStateAction, RefObject } from "react";
import { getIdeaTracks } from "../ideaTracks";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SongIdeasCrudParams {
  setIsUploading: Dispatch<SetStateAction<boolean>>;
  isRecording: boolean;
  stopRecording: () => void;
  recordedAudioUrl: string;
  recordingPromiseRef: RefObject<Promise<string>>;
  useSongBaseTrack: boolean;
  selectedSongBaseUrl: string;
  driveAudioUrl: string;
  selectedAudioFile: File;
  song: Song;
  ideaSection: "general" | "intro" | "verso" | "estribillo" | "puente" | "solo" | "outro";
  ideaTitle: string;
  genAiOnNewIdea: boolean;
  newIdeaBpm: number;
  newIdeaKey: string;
  newIdeaIncludeDrums: boolean;
  newIdeaIncludeBass: boolean;
  newIdeaStyle: DrumPatternStyle;
  ideaUploader: string;
  currentUsername: string;
  ideaInstrument: string;
  ideaNotes: string;
  nuevaIdeaPistasIris: string[];
  onUpdateSong: (updatedSong: Song) => void;
  setIdeaTitle: Dispatch<SetStateAction<string>>;
  setIdeaNotes: Dispatch<SetStateAction<string>>;
  setSelectedAudioFile: Dispatch<SetStateAction<File>>;
  setRecordedAudioUrl: Dispatch<SetStateAction<string>>;
  setDriveAudioUrl: Dispatch<SetStateAction<string>>;
  setGenAiOnNewIdea: Dispatch<SetStateAction<boolean>>;
  setNuevaIdeaPistasIris: Dispatch<SetStateAction<string[]>>;
  setShowAddIdea: Dispatch<SetStateAction<boolean>>;
  playingIdeaId: string;
  ideasList: SongAudioIdea[];
  trackAudioRefs: RefObject<Record<string, HTMLAudioElement>>;
  setPlayingIdeaId: Dispatch<SetStateAction<string>>;
  setConfirmDeleteModal: Dispatch<SetStateAction<{ title: string; description: string; onConfirm: () => void; }>>;
}

/**
 * CRUD de ideas de audio: guardar, crear, votar, borrar, duplicar y borrar comentarios
 * @param params Estado y callbacks del contenedor ({@link SongIdeasCrudParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSongIdeasCrud({ setIsUploading, isRecording, stopRecording, recordedAudioUrl, recordingPromiseRef, useSongBaseTrack, selectedSongBaseUrl, driveAudioUrl, selectedAudioFile, song, ideaSection, ideaTitle, genAiOnNewIdea, newIdeaBpm, newIdeaKey, newIdeaIncludeDrums, newIdeaIncludeBass, newIdeaStyle, ideaUploader, currentUsername, ideaInstrument, ideaNotes, nuevaIdeaPistasIris, onUpdateSong, setIdeaTitle, setIdeaNotes, setSelectedAudioFile, setRecordedAudioUrl, setDriveAudioUrl, setGenAiOnNewIdea, setNuevaIdeaPistasIris, setShowAddIdea, playingIdeaId, ideasList, trackAudioRefs, setPlayingIdeaId, setConfirmDeleteModal }: SongIdeasCrudParams) {
  const handleSaveIdea = async () => {
    try {
      setIsUploading(true);

      // 1. If currently recording with mic, stop and await the upload automatically
      if (isRecording) {
        stopRecording();
      }

      let primaryAudioUrl = recordedAudioUrl || '';

      // If recording promise is pending or just completed, await it
      if (!primaryAudioUrl && recordingPromiseRef.current) {
        try {
          primaryAudioUrl = await recordingPromiseRef.current;
        } catch (e) {
          console.warn('Error awaiting recording URL:', e);
        }
      }

      // 2. Check selected audio file, drive URL, or song base track if no mic recording
      if (!primaryAudioUrl) {
        if (useSongBaseTrack && selectedSongBaseUrl) {
          primaryAudioUrl = selectedSongBaseUrl;
        } else if (driveAudioUrl.trim()) {
          primaryAudioUrl = driveAudioUrl.trim();
        } else if (selectedAudioFile) {
          primaryAudioUrl = await uploadFileToServer(selectedAudioFile);
        }
      }

      // 3. Prepare secondary track if song base track is toggled alongside user's recording/file
      let secondaryBaseTrack: { url: string; label: string; instrument: string } | undefined = undefined;
      if (useSongBaseTrack && selectedSongBaseUrl && primaryAudioUrl !== selectedSongBaseUrl) {
        secondaryBaseTrack = {
          url: selectedSongBaseUrl,
          label: `🎵 Base: Tema Original (${song.titulo})`,
          instrument: 'Tema Base',
        };
      }

      // Auto-generate title if user left title blank
      const sectionInfo = SECCIONES_TEMA.find((s) => s.key === ideaSection);
      const sectionLabel = sectionInfo?.label || ideaSection;
      const autoTitle = selectedAudioFile
        ? selectedAudioFile.name.replace(/\.[^/.]+$/, '')
        : useSongBaseTrack && primaryAudioUrl === selectedSongBaseUrl
          ? `Idea sobre ${song.titulo} (${sectionLabel})`
          : `Idea ${sectionLabel} - ${new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const finalTitle = ideaTitle.trim() || autoTitle;

      // 4. AI Backing track generation if selected
      if (genAiOnNewIdea) {
        const aiWavBlob = await generateAccompanimentAudioBlob({
          bpm: newIdeaBpm,
          durationSecs: 30,
          keyName: newIdeaKey,
          includeDrums: newIdeaIncludeDrums,
          includeBass: newIdeaIncludeBass,
          drumPattern: newIdeaStyle,
        });
        const aiFile = new File([aiWavBlob], `base-ia-${newIdeaStyle}-${Date.now()}.wav`, { type: 'audio/wav' });
        const aiServerUrl = await uploadFileToServer(aiFile);

        const parts = [];
        if (newIdeaIncludeDrums) parts.push('Batería');
        if (newIdeaIncludeBass) parts.push('Bajo');
        const aiTrackLabel = `Ref AI: ${parts.join(' + ') || 'IA Synth'} (${newIdeaStyle.toUpperCase()} - ${newIdeaKey})`;

        const aiTrackInfo = {
          url: aiServerUrl,
          label: aiTrackLabel,
          instrument: parts.join(' + ') || 'IA Synth',
        };

        if (useSongBaseTrack && selectedSongBaseUrl) {
          createNewIdea(selectedSongBaseUrl, aiTrackInfo, finalTitle, secondaryBaseTrack);
        } else if (primaryAudioUrl) {
          createNewIdea(primaryAudioUrl, aiTrackInfo, finalTitle, secondaryBaseTrack);
        } else {
          createNewIdea(aiServerUrl, undefined, finalTitle, secondaryBaseTrack);
        }
        return;
      }

      if (!primaryAudioUrl) {
        alert(
          'Debes seleccionar un archivo de audio, cargar el Tema Original, grabar con el micrófono, pegar un enlace de Drive o activar la generación de Base IA para la primera pista de la idea.'
        );
        return;
      }

      createNewIdea(primaryAudioUrl, undefined, finalTitle, secondaryBaseTrack);
    } catch (err) {
      console.error('Error al guardar la idea de audio:', err);
      alert('Error al guardar la idea de audio.');
    } finally {
      setIsUploading(false);
    }
  };

  const createNewIdea = (
    audioDataUrl: string,
    secondaryAiTrack?: { url: string; label: string; instrument: string },
    customTitle?: string,
    secondaryBaseTrack?: { url: string; label: string; instrument: string }
  ) => {
    const finalTitle =
      customTitle ||
      ideaTitle.trim() ||
      `Idea (${ideaSection.toUpperCase()}) ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const isPrimaryBaseTrack = useSongBaseTrack && audioDataUrl === selectedSongBaseUrl;

    const tracks: AudioTrack[] = [
      {
        id: `track-${Date.now()}-1`,
        nombre: isPrimaryBaseTrack
          ? `🎵 Base: ${song.titulo} (Tema Original)`
          : secondaryAiTrack || secondaryBaseTrack
            ? 'Pista 1 (Grabación/Idea)'
            : 'Pista 1 (Base)',
        audioUrl: audioDataUrl,
        autor: isPrimaryBaseTrack ? 'Tema Original' : ideaUploader || currentUsername,
        instrumento: isPrimaryBaseTrack ? 'Tema Base' : ideaInstrument.trim() || undefined,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 1,
        muted: false,
      },
    ];

    if (secondaryBaseTrack) {
      tracks.push({
        id: `track-${Date.now()}-base`,
        nombre: secondaryBaseTrack.label,
        audioUrl: secondaryBaseTrack.url,
        autor: 'Tema Original',
        instrumento: secondaryBaseTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.9,
        muted: false,
      });
    }

    if (secondaryAiTrack) {
      tracks.push({
        id: `track-${Date.now()}-ai`,
        nombre: secondaryAiTrack.label,
        audioUrl: secondaryAiTrack.url,
        autor: 'IA Synthesizer',
        instrumento: secondaryAiTrack.instrument,
        fecha: new Date().toISOString().split('T')[0],
        volumen: 0.85,
        muted: false,
      });
    }

    const newIdea: SongAudioIdea = {
      id: `idea-${Date.now()}`,
      titulo: finalTitle,
      seccion: ideaSection,
      audioUrl: audioDataUrl,
      pistas: tracks,
      subidoPor: ideaUploader || currentUsername,
      instrumento: ideaInstrument.trim() || undefined,
      fecha: new Date().toISOString().split('T')[0],
      notas: ideaNotes.trim() || undefined,
      votos: [currentUsername],
      comentarios: [],
    };

    const idsIris = nuevaIdeaPistasIris.filter((id) => pistasDeCancion(song).some((p) => p.id === id));
    const updatedIdeas = [ideaConPistasBase(newIdea, idsIris), ...(song.audioIdeas || [])];
    onUpdateSong({
      ...cancionConIdeas(song, updatedIdeas),
      // CRITICAL: Preserve original song demo audio and never overwrite with an idea
      audioPrincipalUrl: song.audioPrincipalUrl,
    });

    // Reset form & promise
    recordingPromiseRef.current = null;
    setIdeaTitle('');
    setIdeaNotes('');
    setSelectedAudioFile(null);
    setRecordedAudioUrl(null);
    setDriveAudioUrl('');
    setGenAiOnNewIdea(false);
    setNuevaIdeaPistasIris([]);
    setShowAddIdea(false);
  };

  // Toggle upvote / like
  const handleToggleVote = (ideaId: string) => {
    const updatedIdeas = (song.audioIdeas || []).map((idea) => {
      if (idea.id === ideaId) {
        const currentVotos = idea.votos || [];
        const hasVoted = currentVotos.includes(currentUsername);
        const newVotos = hasVoted ? currentVotos.filter((u) => u !== currentUsername) : [...currentVotos, currentUsername];
        return { ...idea, votos: newVotos };
      }
      return idea;
    });

    onUpdateSong(cancionConIdeas(song, updatedIdeas));
  };

  // Delete whole idea
  const handleDeleteIdea = (e?: React.MouseEvent, ideaId?: string, skipModal = false) => {
    if (e) e.stopPropagation();
    if (!ideaId) return;

    const executeDelete = () => {
      // Pause any playing audio
      if (playingIdeaId === ideaId) {
        const activeIdea = ideasList.find((i) => i.id === ideaId);
        if (activeIdea) {
          getIdeaTracks(activeIdea).forEach((tr) => {
            const el = trackAudioRefs.current[tr.id];
            if (el) el.pause();
          });
        }
        setPlayingIdeaId(null);
      }

      const updatedIdeas = (song.audioIdeas || []).filter((i) => i.id !== ideaId);

      onUpdateSong({
        ...cancionConIdeas(song, updatedIdeas),
        audioPrincipalUrl: song.audioPrincipalUrl,
      });
    };

    if (skipModal) {
      executeDelete();
      return;
    }

    const idea = (song.audioIdeas || []).find((i) => i.id === ideaId);
    setConfirmDeleteModal({
      title: 'Eliminar Idea de Audio',
      description: `¿Estás seguro de que deseas eliminar la idea "${idea?.titulo || 'sin título'}"? Se borrarán todas las pistas y comentarios asociados.`,
      onConfirm: executeDelete,
    });
  };

  // Duplica una idea (con todas sus pistas/stems) como una nueva versión independiente, para
  // probar un arreglo distinto sin tocar ni arriesgar la versión que ya está validada por la
  // banda. Empieza sin votos ni comentarios propios: es una idea nueva, no un historial compartido.
  const handleDuplicateIdea = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    const ideas = song.audioIdeas || [];
    const original = ideas.find((i) => i.id === ideaId);
    if (!original) return;

    const baseTitle = original.titulo.replace(/\s+\(v\d+\)$/i, '');
    const versionCount = ideas.filter((i) => i.titulo === baseTitle || i.titulo.startsWith(`${baseTitle} (v`)).length;
    const newIdeaId = `idea-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const clonedTracks: AudioTrack[] = getIdeaTracks(original).map((t, idx) => ({
      ...t,
      id: `${newIdeaId}-track-${idx + 1}`,
    }));

    const duplicated: SongAudioIdea = {
      ...original,
      id: newIdeaId,
      titulo: `${baseTitle} (v${versionCount + 1})`,
      pistas: clonedTracks,
      subidoPor: currentUsername,
      fecha: new Date().toLocaleDateString('es-ES'),
      votos: [],
      comentarios: [],
    };

    onUpdateSong(cancionConIdeas(song, [...ideas, duplicated]));
  };

  // Delete comment from idea
  const handleDeleteComment = (idea: SongAudioIdea, commentId: string) => {
    setConfirmDeleteModal({
      title: 'Eliminar Comentario',
      description: '¿Deseas eliminar este comentario?',
      onConfirm: () => {
        const updatedComments = (idea.comentarios || []).filter((c) => c.id !== commentId);
        const updatedIdeas = (song.audioIdeas || []).map((i) => (i.id === idea.id ? { ...i, comentarios: updatedComments } : i));
        onUpdateSong(cancionConIdeas(song, updatedIdeas));
      },
    });
  };

  return { handleDeleteIdea, handleDuplicateIdea, handleToggleVote, handleDeleteComment, handleSaveIdea };
}
