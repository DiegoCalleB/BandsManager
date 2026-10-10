/**
 * Genera, descarga y guarda en la canción los acompañamientos y las ideas melódicas propuestos.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useRef, useState } from "react";
import type { Song, User } from "../../../types";
import { SongAudioIdea } from "../../../types";
import { generateAccompanimentAudioBlob } from "../../../utils/accompanimentSynth";
import { uploadFileToServer } from "../../../utils/audioStorage";
import { getErrorMessage } from "../../../utils/errorMessage";
import { renderMelodicIdeaAudioBlob } from "../../../utils/instrumentSynth";
import { eventosAMidiBlob } from "../../../utils/midiExport";
import type { ProposedAction } from "../chatTypes";


/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatAudioGenerationParams {
  currentUser: User;
  cleanUserName: string;
}

/**
 * Genera, descarga y guarda en la canción los acompañamientos y las ideas melódicas propuestos.
 * @param params Estado y callbacks del contenedor ({@link ChatAudioGenerationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatAudioGeneration({ currentUser, cleanUserName }: ChatAudioGenerationParams) {
  // Bases rítmicas generadas al vuelo (síntesis local Web Audio) por'propose_accompaniment',
  // guardadas por clave"msgId-actionIndex" para no regenerar el audio en cada re-render.
  const [accompanimentAudio, setAccompanimentAudio] = useState<
    Record<
      string,
      {
        loading: boolean;
        url?: string;
        error?: string;
        saving?: boolean;
        savedToSong?: string;
        saveError?: string;
      }
    >
  >({});

  // Cuando el chatbot no ha identificado una canción exacta del repertorio (el usuario pidió la
  // base/idea sin nombrar un tema, o Gemini no encontró coincidencia), en vez de fallar con un
  // error sin salida se ofrece un desplegable para elegir a mano en qué canción guardarla.
  // Compartido entre'propose_accompaniment' y'propose_melodic_idea': audioKey ("msgId-actionIndex")
  // es único por acción dentro del mensaje, así que no hay colisión entre ambos tipos.
  const [songPicker, setSongPicker] = useState<Record<string, { songs: { id: string; titulo: string }[]; selectedId: string }>>({});

  const accompanimentAudioRef = useRef(accompanimentAudio);

  // Ideas melódicas por instrumento ('propose_melodic_idea', síntesis local Tone.js), misma
  // mecánica que accompanimentAudio: se generan bajo demanda y se guardan por clave"msgId-actionIndex".
  const [melodicIdeaAudio, setMelodicIdeaAudio] = useState<
    Record<
      string,
      {
        loading: boolean;
        url?: string;
        error?: string;
        saving?: boolean;
        savedToSong?: string;
        saveError?: string;
      }
    >
  >({});

  const melodicIdeaAudioRef = useRef(melodicIdeaAudio);

  const buildBandAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('bakandeya_token');
    const activeBandId = currentUser?.band_id || '';
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(activeBandId ? { 'x-band-id': activeBandId } : {}),
    };
  };

  const handleGenerateAccompanimentAudio = async (key: string, params: NonNullable<ProposedAction['accompaniment']>) => {
    setAccompanimentAudio((prev) => ({ ...prev, [key]: { loading: true } }));
    try {
      const blob = await generateAccompanimentAudioBlob({
        bpm: params.bpm,
        durationSecs: params.durationSecs,
        keyName: params.keyName,
        includeDrums: params.includeDrums,
        includeBass: params.includeBass,
        drumPattern: params.drumPattern,
      });
      const url = URL.createObjectURL(blob);
      setAccompanimentAudio((prev) => ({ ...prev, [key]: { loading: false, url } }));
    } catch (err) {
      console.error('Error generando base rítmica:', err);
      setAccompanimentAudio((prev) => ({ ...prev, [key]: { loading: false, error: 'No se pudo sintetizar el audio en este navegador.' } }));
    }
  };

  // Guarda la base ya generada como una nueva idea de audio en una canción existente del
  // repertorio. Se manda SIEMPRE la canción completa (fetch + spread), nunca un parche parcial:
  // dbUpsertSong rellena con valores por defecto cualquier campo ausente (ver server/db/repertoire.ts),
  // así que un PUT parcial borraría título, bpm y tonalidad de la canción real.
  const handleSaveAccompanimentToSong = async (
    key: string,
    params: NonNullable<ProposedAction['accompaniment']>,
    overrideSongId?: string
  ) => {
    const current = accompanimentAudio[key];
    if (!current?.url) return;

    setAccompanimentAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: true, saveError: undefined } }));
    try {
      const activeBandId = currentUser?.band_id || '';
      const headers = buildBandAuthHeaders();

      const songsRes = await fetch('/api/songs', { headers });
      const songsData = await songsRes.json().catch(() => null);
      const allSongs: Song[] = songsData?.songs || [];

      let targetSong = overrideSongId ? allSongs.find((s) => s.id === overrideSongId) : undefined;
      if (!targetSong) {
        targetSong = params.songId ? allSongs.find((s) => s.id === params.songId) : undefined;
      }
      if (!targetSong && params.songTitle) {
        const lowerTitle = params.songTitle.trim().toLowerCase();
        targetSong =
          allSongs.find((s) => (s.titulo || '').trim().toLowerCase() === lowerTitle) ||
          allSongs.find((s) => (s.titulo || '').toLowerCase().includes(lowerTitle));
      }
      // No se ha podido resolver la canción sola (ni por id ni por título, ni el usuario ha
      // elegido una del desplegable todavía): en vez de fallar sin salida, se ofrece elegir a
      // mano entre las canciones reales del repertorio.
      if (!targetSong) {
        setAccompanimentAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: false } }));
        setSongPicker((prev) => ({
          ...prev,
          [key]: { songs: allSongs.map((s) => ({ id: s.id, titulo: s.titulo })), selectedId: prev[key]?.selectedId || '' },
        }));
        return;
      }

      const wavBlob = await (await fetch(current.url)).blob();
      const fileName = `chatbot-base-${params.drumPattern}-${Date.now()}.wav`;
      const file = new File([wavBlob], fileName, { type: 'audio/wav' });
      const uploadedUrl = await uploadFileToServer(file, { bandId: activeBandId });

      const newIdea: SongAudioIdea = {
        id: `idea-${Date.now()}`,
        titulo: `Base IA (${params.drumPattern.toUpperCase()} - ${params.keyName})`,
        seccion: 'general',
        audioUrl: uploadedUrl,
        subidoPor: cleanUserName,
        instrumento: params.includeDrums && params.includeBass ? 'Batería + Bajo (AI)' : params.includeDrums ? 'Batería (AI)' : 'Bajo (AI)',
        fecha: new Date().toISOString().split('T')[0],
        notas: `Generada desde el chatbot a ${params.bpm} BPM.`,
      };

      const updatedSong = { ...targetSong, audioIdeas: [...(targetSong.audioIdeas || []), newIdea] };

      const putRes = await fetch(`/api/songs/${encodeURIComponent(targetSong.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedSong),
      });
      if (!putRes.ok) throw new Error('El servidor rechazó el guardado de la canción.');

      setAccompanimentAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: false, savedToSong: targetSong.titulo } }));
      setSongPicker((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      console.error('Error guardando base rítmica en el repertorio:', err);
      setAccompanimentAudio((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: false, saveError: getErrorMessage(err, 'No se pudo guardar en el repertorio.') },
      }));
    }
  };

  const handleGenerateMelodicIdeaAudio = async (key: string, params: NonNullable<ProposedAction['melodicIdea']>) => {
    setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { loading: true } }));
    try {
      const blob = await renderMelodicIdeaAudioBlob({
        instrument: params.instrument,
        bpm: params.bpm,
        durationSecs: params.durationSecs,
        eventos: params.eventos,
      });
      const url = URL.createObjectURL(blob);
      setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { loading: false, url } }));
    } catch (err) {
      console.error('Error generando idea melódica:', err);
      setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { loading: false, error: 'No se pudo sintetizar el audio en este navegador.' } }));
    }
  };

  // Descarga la idea como .mid. Un WAV solo se puede escuchar; un MIDI se abre en cualquier DAW o
  // editor de partituras y se edita nota a nota, así que es la forma de que la idea salga de aquí.
  const handleDownloadMelodicIdeaMidi = (params: NonNullable<ProposedAction['melodicIdea']>) => {
    const instrumentLabel = params.instrument.charAt(0).toUpperCase() + params.instrument.slice(1);
    const blob = eventosAMidiBlob({
      eventos: params.eventos,
      bpm: params.bpm,
      instrument: params.instrument,
      nombrePista: `Idea IA ${instrumentLabel} ${params.keyName}`,
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `idea-${params.instrument}-${params.keyName}-${params.bpm}bpm.mid`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const handleSaveMelodicIdeaToSong = async (key: string, params: NonNullable<ProposedAction['melodicIdea']>, overrideSongId?: string) => {
    const current = melodicIdeaAudio[key];
    if (!current?.url) return;

    setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: true, saveError: undefined } }));
    try {
      const activeBandId = currentUser?.band_id || '';
      const headers = buildBandAuthHeaders();

      const songsRes = await fetch('/api/songs', { headers });
      const songsData = await songsRes.json().catch(() => null);
      const allSongs: Song[] = songsData?.songs || [];

      let targetSong = overrideSongId ? allSongs.find((s) => s.id === overrideSongId) : undefined;
      if (!targetSong) {
        targetSong = params.songId ? allSongs.find((s) => s.id === params.songId) : undefined;
      }
      if (!targetSong && params.songTitle) {
        const lowerTitle = params.songTitle.trim().toLowerCase();
        targetSong =
          allSongs.find((s) => (s.titulo || '').trim().toLowerCase() === lowerTitle) ||
          allSongs.find((s) => (s.titulo || '').toLowerCase().includes(lowerTitle));
      }
      // Igual que en handleSaveAccompanimentToSong: sin coincidencia automática, se ofrece elegir
      // a mano en vez de fallar sin salida.
      if (!targetSong) {
        setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: false } }));
        setSongPicker((prev) => ({
          ...prev,
          [key]: { songs: allSongs.map((s) => ({ id: s.id, titulo: s.titulo })), selectedId: prev[key]?.selectedId || '' },
        }));
        return;
      }

      const wavBlob = await (await fetch(current.url)).blob();
      const fileName = `chatbot-idea-${params.instrument}-${Date.now()}.wav`;
      const file = new File([wavBlob], fileName, { type: 'audio/wav' });
      const uploadedUrl = await uploadFileToServer(file, { bandId: activeBandId });

      const instrumentLabel = params.instrument.charAt(0).toUpperCase() + params.instrument.slice(1);
      const newIdea: SongAudioIdea = {
        id: `idea-${Date.now()}`,
        titulo: `Idea IA de ${instrumentLabel} (${params.keyName})`,
        seccion: params.seccion || 'general',
        audioUrl: uploadedUrl,
        subidoPor: cleanUserName,
        instrumento: `${instrumentLabel} (AI)`,
        fecha: new Date().toISOString().split('T')[0],
        notas: `Generada desde el chatbot a ${params.bpm} BPM.`,
      };

      const updatedSong = { ...targetSong, audioIdeas: [...(targetSong.audioIdeas || []), newIdea] };

      const putRes = await fetch(`/api/songs/${encodeURIComponent(targetSong.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedSong),
      });
      if (!putRes.ok) throw new Error('El servidor rechazó el guardado de la canción.');

      setMelodicIdeaAudio((prev) => ({ ...prev, [key]: { ...prev[key], saving: false, savedToSong: targetSong.titulo } }));
      setSongPicker((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      console.error('Error guardando idea melódica en el repertorio:', err);
      setMelodicIdeaAudio((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: false, saveError: getErrorMessage(err, 'No se pudo guardar en el repertorio.') },
      }));
    }
  };

  accompanimentAudioRef.current = accompanimentAudio;

  melodicIdeaAudioRef.current = melodicIdeaAudio;

  useEffect(() => {
    return () => {
      Object.values(accompanimentAudioRef.current).forEach((entry) => {
        if (entry.url) URL.revokeObjectURL(entry.url);
      });
      Object.values(melodicIdeaAudioRef.current).forEach((entry) => {
        if (entry.url) URL.revokeObjectURL(entry.url);
      });
    };
  }, []);

  return { accompanimentAudio, songPicker, setSongPicker, handleSaveAccompanimentToSong, handleGenerateAccompanimentAudio, melodicIdeaAudio, handleDownloadMelodicIdeaMidi, handleSaveMelodicIdeaToSong, handleGenerateMelodicIdeaAudio };
}
