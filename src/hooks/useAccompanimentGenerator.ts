import { useState } from 'react';
import { Song, SongAudioIdea } from '../types';
import { uploadFileToServer } from '../utils/audioStorage';
import { generateAccompanimentAudioBlob } from '../utils/accompanimentSynth';

export function useAccompanimentGenerator(
  song: Song,
  saveNewTrackToIdea: (idea: SongAudioIdea, audioUrl: string, customTrackName?: string, customInstrument?: string, initialDesfaseMs?: number) => void
) {
  // --- ACCOMPANIMENT GENERATOR STATE ---
  const [showGenModalForIdea, setShowGenModalForIdea] = useState<SongAudioIdea | null>(null);
  const [genBpm, setGenBpm] = useState<number>(song.bpm || 120);
  const [genKey, setGenKey] = useState<string>(song.tonalidad || 'Do');
  const [genDuration, setGenDuration] = useState<number>(30);
  const [includeDrums, setIncludeDrums] = useState<boolean>(true);
  const [includeBass, setIncludeBass] = useState<boolean>(true);
  const [drumStyle, setDrumStyle] = useState<'rock' | 'pop' | 'funk' | 'reggae'>('rock');
  const [isGeneratingAccompaniment, setIsGeneratingAccompaniment] = useState<boolean>(false);

  const handleGenerateAccompaniment = async () => {
    if (!showGenModalForIdea) return;
    try {
      setIsGeneratingAccompaniment(true);

      const wavBlob = await generateAccompanimentAudioBlob({
        bpm: genBpm,
        durationSecs: genDuration,
        keyName: genKey,
        includeDrums,
        includeBass,
        drumPattern: drumStyle
      });

      const fileName = `sugerencia-${drumStyle}-${genKey}-${Date.now()}.wav`;
      const file = new File([wavBlob], fileName, { type: 'audio/wav' });

      const serverUrl = await uploadFileToServer(file);

      let trackLabel = 'Ref IA: Batería y Bajo';
      if (includeDrums && includeBass) trackLabel = `🥁🎸 Ref AI (${drumStyle.toUpperCase()} - ${genKey})`;
      else if (includeDrums) trackLabel = `🥁 Ref AI: Batería (${drumStyle.toUpperCase()})`;
      else if (includeBass) trackLabel = `🎸 Ref AI: Bajo Tónica (${genKey})`;

      saveNewTrackToIdea(
        showGenModalForIdea, 
        serverUrl, 
        trackLabel, 
        includeDrums && includeBass ? 'Batería + Bajo (AI)' : includeDrums ? 'Batería (AI)' : 'Bajo (AI)'
      );

      setShowGenModalForIdea(null);
      alert(`¡Acompañamiento sintetizado con éxito! Se ha agregado al mezclador multipista como "${trackLabel}". Sincronizado a ${genBpm} BPM.`);
    } catch (err) {
      console.error("Error al generar acompañamiento:", err);
      alert("Error al sintetizar el acompañamiento de referencia.");
    } finally {
      setIsGeneratingAccompaniment(false);
    }
  };

  return {
    showGenModalForIdea, setShowGenModalForIdea,
    genBpm, setGenBpm,
    genKey, setGenKey,
    genDuration, setGenDuration,
    includeDrums, setIncludeDrums,
    includeBass, setIncludeBass,
    drumStyle, setDrumStyle,
    isGeneratingAccompaniment,
    handleGenerateAccompaniment,
  };
}
