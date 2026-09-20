import { useState } from' react';
import { Song, SongAudioIdea, DrumPatternStyle } from' ../types';
import { uploadFileToServer } from' ../utils/audioStorage';
import { generateAccompanimentAudioBlob } from' ../utils/accompanimentSynth';

export function useAccompanimentGenerator(
 song: Song,
 saveNewTrackToIdea: (idea: SongAudioIdea, audioUrl: string, customTrackName?: string, customInstrument?: string, initialDesfaseMs?: number) => void
) {
 // --- ACCOMPANIMENT GENERATOR STATE ---
 const [showGenModalForIdea, setShowGenModalForIdea] = useState<SongAudioIdea | null>(null);
 const [genBpm, setGenBpm] = useState<number>(song.bpm || 120);
 const [genKey, setGenKey] = useState<string>(song.tonalidad ||' Do');
 const [genDuration, setGenDuration] = useState<number>(30);
 const [includeDrums, setIncludeDrums] = useState<boolean>(true);
 const [includeBass, setIncludeBass] = useState<boolean>(true);
 const [drumStyle, setDrumStyle] = useState<DrumPatternStyle>('rock');
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
 const file = new File([wavBlob], fileName, { type:' audio/wav' });

 const serverUrl = await uploadFileToServer(file);

 const parts = [];
 if (includeDrums) parts.push('Batería');
 if (includeBass) parts.push('Bajo');
 const trackLabel = `Ref IA: ${parts.join(' +' ) ||' Acompañamiento'} (${genKey})`;

 saveNewTrackToIdea(
 showGenModalForIdea, 
 serverUrl, 
 trackLabel, 
 parts.join(' +' ) ||' IA Synth'
 );

 setShowGenModalForIdea(null);
 alert(`¡Acompañamiento sintetizado con éxito teniendo en cuenta la tonalidad (${genKey}) y tempo (${genBpm} BPM)! Se ha agregado al mezclador multipista como "${trackLabel}".`);
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
