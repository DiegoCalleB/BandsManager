/**
 * Generador de pista de instrumento con IA y separación de stems con Iris: formularios, vista previa, generación y alta de la pista en la idea
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
import { useState, Dispatch, SetStateAction } from "react";
import { SongAudioIdea, AudioTrack, Song } from "../../../types";
import { AI_TRACK_STYLE_PRESETS } from "../studioConstants";
import { useSeparacionIris } from "../../../hooks/useSeparacionIris";
import { getIdeaTracks } from "../ideaTracks";
import { resolveAudioUrl, getAudioBlobFromUrl, uploadFileToServer } from "../../../utils/audioStorage";
import { apiFetch } from "../../../utils/api";
import { cancionConPistas } from "../../../utils/irisTracks";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AiTrackGenerationParams {
  song: Song;
  onUpdateSong: (updatedSong: Song) => void;
  selectedStemEngine: "fal" | "mvsep-mdx23" | "demucs" | "dsp-server";
  selectedStemsToExtract: string[];
  setExpandedIdeaIds: Dispatch<SetStateAction<Set<string>>>;
}

/**
 * Generador de pista de instrumento con IA y separación de stems con Iris: formularios, vista previa, generación y alta de la pista en la idea
 * @param params Estado y callbacks del contenedor ({@link AiTrackGenerationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAiTrackGeneration({ song, onUpdateSong, selectedStemEngine, selectedStemsToExtract, setExpandedIdeaIds }: AiTrackGenerationParams) {
  // AI Instrument Track Generator State — guarda la idea de destino (no un simple boolean) para
  // saber a qué mezcla añadir la pista generada; antes se asumía siempre audioIdeas[0], ignorando
  // sobre qué idea había pulsado el usuario el botón.
  const [showAiTrackGenModal, setShowAiTrackGenModal] = useState<SongAudioIdea | null>(null);
  const [aiTrackGenInstrument, setAiTrackGenInstrument] = useState<string>('Guitarra Solista');
  const [aiTrackGenMode, setAiTrackGenMode] = useState<'presets' | 'custom'>('presets');
  const [aiTrackGenStyle, setAiTrackGenStyle] = useState<string>(AI_TRACK_STYLE_PRESETS[0].style);
  const [aiTrackGenPrompt, setAiTrackGenPrompt] = useState<string>('');
  // Segundo de la canción en el que debe empezar a sonar la pista generada — Lyria solo genera
  // clips de ~30s fieles al contexto, así que en vez de pedirle una canción entera (peor
  // resultado, ver commit anterior), dejamos elegir EN QUÉ PARTE de la canción encaja ese clip
  // (p.ej. el puente en el minuto 1:45), colocándolo ahí en vez de siempre al principio.
  const [aiTrackGenStartOffsetSec, setAiTrackGenStartOffsetSec] = useState<number>(0);
  const [aiTrackGenError, setAiTrackGenError] = useState<string | null>(null);
  const [aiTrackGenPreview, setAiTrackGenPreview] = useState<{
    audioUrl: string;
    trackName: string;
    arrangementNotes: string;
  } | null>(null);
  const [isGeneratingAiTrack, setIsGeneratingAiTrack] = useState<boolean>(false);
  const {
    isSeparatingStemsAi,
    separationElapsedSeconds,
    stemProgressModal,
    setStemProgressModal,
    showStemErrorDetails,
    setShowStemErrorDetails,
    copiedStemError,
    setCopiedStemError,
    handlePerformAiStemSeparation,
    handleCancelStemSeparation,
  } = useSeparacionIris({
    song,
    onUpdateSong,
    motor: selectedStemEngine,
    pistasElegidas: selectedStemsToExtract,
    alTerminarIdea: (ids) => setExpandedIdeaIds((prev) => new Set([...prev, ...ids])),
  });


  // AI Custom Instrument Track Generator Handler — genera y deja en previsualización, NUNCA
  // compromete directo al mezclador: la IA generativa a veces devuelve algo que no encaja, y
  // forzar al usuario a escucharlo ya integrado en su mezcla (o peor, tener que deshacerlo a mano)
  // es peor experiencia que dejarle escuchar antes y decidir"Añadir" o"Descartar".
  const handleGenerateAiInstrumentTrack = async (targetIdea: SongAudioIdea) => {
    if (!aiTrackGenInstrument) return;
    setAiTrackGenError(null);
    setAiTrackGenPreview(null);
    try {
      setIsGeneratingAiTrack(true);

      // Audio real de la idea para que el motor (MusicGen) pueda ESCUCHAR melodía/acordes/ritmo
      // en vez de adivinar desde una descripción de texto — mismo saneado que ya hace la
      // separación de stems para blobs/IndexedDB, que Replicate no puede ir a buscar por sí solo.
      // idea.audioUrl es"la pista principal o legacy" y puede estar vacío en ideas que solo
      // tienen pistas separadas (stems) o grabaciones multipista — sin este fallback, esas ideas
      // se iban derechas a Lyria (solo texto) sin que se notara por qué.
      const originalSourceAudioUrl = targetIdea.audioUrl || getIdeaTracks(targetIdea)[0]?.audioUrl || '';
      let sourceAudioUrl: string | undefined = originalSourceAudioUrl || undefined;
      try {
        if (sourceAudioUrl) {
          const resolved = await resolveAudioUrl(sourceAudioUrl);
          if (resolved) sourceAudioUrl = resolved;
          if (sourceAudioUrl.startsWith('indexeddb:') || sourceAudioUrl.startsWith('blob:') || sourceAudioUrl.startsWith('data:')) {
            const blob = await getAudioBlobFromUrl(originalSourceAudioUrl);
            const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'mp3';
            const file = new File([blob], `source-audio-${Date.now()}.${ext}`, {
              type: blob.type || 'audio/mpeg',
            });
            const bandIdToUse = localStorage.getItem('bandmanager_band_id') || undefined;
            const uploadedUrl = await uploadFileToServer(file, {
              category: 'stems',
              folder: 'inputs',
              bandId: bandIdToUse,
            });
            if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://') || uploadedUrl.startsWith('/'))) {
              sourceAudioUrl = uploadedUrl;
            }
          }
        }
      } catch (prepErr) {
        console.warn('[AI Track Gen] No se pudo preparar el audio de referencia, se generará solo por texto:', prepErr);
        sourceAudioUrl = undefined;
      }

      const data = await apiFetch('/api/ai-generate-instrument-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument: aiTrackGenInstrument,
          songTitle: song.titulo,
          sectionName: targetIdea.seccion,
          bpm: song.bpm,
          key: song.tonalidad,
          genero: song.genero,
          style: aiTrackGenMode === 'presets' ? aiTrackGenStyle : undefined,
          contextPrompt: aiTrackGenMode === 'custom' ? aiTrackGenPrompt : undefined,
          targetDurationSec: song.duracionSegundos || undefined,
          sourceAudioUrl,
        }),
      });

      const generatedAudioUrl =
        data.audioUrl || (data.audioBase64 ? `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}` : null);
      if (!generatedAudioUrl) {
        throw new Error(
          'La IA no devolvió audio esta vez (puede pasar con Lyria/MusicGen). Prueba a regenerar o cambia el estilo/instrucción.'
        );
      }

      setAiTrackGenPreview({
        audioUrl: generatedAudioUrl,
        trackName: data.trackName || `Pista IA: ${aiTrackGenInstrument}`,
        arrangementNotes: data.arrangementNotes || 'Generado en armonía con la tonalidad y BPM.',
      });
    } catch (err: any) {
      console.error('Error al generar pista por IA:', err);
      setAiTrackGenError(err?.message || 'No se pudo generar la pista de instrumento. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingAiTrack(false);
    }
  };

  const handleConfirmAddAiTrack = (targetIdea: SongAudioIdea) => {
    if (!aiTrackGenPreview) return;
    const existing = getIdeaTracks(targetIdea);
    const newAiTrack: AudioTrack = {
      id: `ai-track-${Date.now()}`,
      nombre: aiTrackGenPreview.trackName,
      audioUrl: aiTrackGenPreview.audioUrl,
      autor: 'IA Lyria & Gemini',
      instrumento: aiTrackGenInstrument,
      fecha: new Date().toISOString().split('T')[0],
      volumen: 1,
      muted: false,
      // Negativo = retrasa la entrada de la pista en la mezcla (mismo campo que la corrección
      // fina de latencia, reutilizado aquí para colocar el clip de ~30s en el punto de la canción
      // que el usuario eligió en vez de siempre al principio).
      desfaseMs: aiTrackGenStartOffsetSec > 0 ? -(aiTrackGenStartOffsetSec * 1000) : 0,
    };

    onUpdateSong(cancionConPistas(song, targetIdea, [...existing, newAiTrack]));
    setShowAiTrackGenModal(null);
    setAiTrackGenPreview(null);
    setAiTrackGenPrompt('');
    setAiTrackGenStartOffsetSec(0);
  };

  return { setAiTrackGenPreview, setAiTrackGenError, setAiTrackGenStartOffsetSec, setShowAiTrackGenModal, isSeparatingStemsAi, handlePerformAiStemSeparation, showAiTrackGenModal, stemProgressModal, setStemProgressModal };
}
