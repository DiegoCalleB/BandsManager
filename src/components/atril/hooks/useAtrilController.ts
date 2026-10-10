/**
 * Controlador del Atril: compone estado base, audio, análisis de acordes, edición y armonía.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { ResolvedAtrilProps } from "../../Atril";
import { useAtrilAudio } from "./useAtrilAudio";
import { useAtrilEditing } from "./useAtrilEditing";
import { useAtrilHarmony } from "./useAtrilHarmony";
import { useAtrilState } from "./useAtrilState";
import { useChordAnalysis } from "./useChordAnalysis";

/**
 * Estado y acciones del Atril.
 * @param params Props del Atril con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useAtrilController({ song, modo, onUpdateSong }: ResolvedAtrilProps) {
  const { ajustes, transpose, setAiSuccessMsg, setCifradoTexto, setGuiaSustituto, setIsAnalyzingChords, setOidoOculto, setShowAnalisisAcordes, analisisAcordes, isAnalyzingChords, setIsGeneratingAi, cifradoTexto, guiaSustituto, setActiveTab, notation, seguirEnCifrado, showAnalisisAcordes, scrollContainerRef, activeTab, autoScroll, setCopiedText, pantallaCompleta, alternarPantallaCompleta, isGeneratingAi, setShowStructureUploadModal, setShowShareModal, setShowMetronomeModal, setShowTunerModal, setTranspose, metronomo, setNotation, showChordDiagrams, setShowChordDiagrams, copiedText, aiSuccessMsg, setSeguirEnCifrado, vistaAcordes, setVistaAcordes, showShareModal, showMetronomeModal, showTunerModal, oidoOculto, showStructureUploadModal } = useAtrilState({ modo, song });

  const { buscarEnAudio, audioUrl, audioCurrentTime, isPlayingAudio, handleToggleAudio, handleRestartAudio, formatAudioTime, audioDuration, handleSeekAudio, stems, iris, separarConIris, modoEscucha, setModoEscucha, miId, setMiPistaId, velocidad, setVelocidad, audioSigueTono, setAudioSigueTono, bucle, marcarBucle, limpiarBucle, tomas, tomaActivaId, setTomaActivaId, pistasSonando, ajustesPistas, setAjustesPistas, grabacion, guardandoIdea, guardarIdea, setMasControles, masControles, audioRef, setAudioCurrentTime, setAudioDuration, setIsPlayingAudio } = useAtrilAudio({ song, onUpdateSong, ajustes, transpose, setAiSuccessMsg });

  const { handleAnalyzeChordsFromAudio } = useChordAnalysis({ setCifradoTexto, song, setGuiaSustituto, setIsAnalyzingChords, setOidoOculto, setAiSuccessMsg, onUpdateSong, setShowAnalisisAcordes, audioUrl, analisisAcordes, isAnalyzingChords });

  const { handleGenerateWithAi, handleCorregirAcordes, pedirProfesor, handleSaveEdits } = useAtrilEditing({ song, analisisAcordes, onUpdateSong, setAiSuccessMsg, setIsGeneratingAi, setOidoOculto, setCifradoTexto, setShowAnalisisAcordes, cifradoTexto, guiaSustituto, setActiveTab });

  const { handleCopyChords, alineacion, armonia, estiloArmonia, nombreTonalidadVista, vibrarAlCambiar, alternarVibracion, cambiarEstiloArmonia, funcionesPresentes, acordesPorFuncion, processedText, lineasConLetra, letraTranscrita, letraActiva, sincronizado, tiemposAcordes, acordeActivo, uniqueChords, contextoAcordes, acordeSonando } = useAtrilHarmony({ cifradoTexto, transpose, notation, analisisAcordes, seguirEnCifrado, showAnalisisAcordes, audioCurrentTime, isPlayingAudio, scrollContainerRef, activeTab, song, autoScroll, setCopiedText });

  return { buscarEnAudio, ajustes, transpose, setAiSuccessMsg, setCifradoTexto, setGuiaSustituto, setIsAnalyzingChords, setOidoOculto, setShowAnalisisAcordes, analisisAcordes, isAnalyzingChords, setIsGeneratingAi, cifradoTexto, guiaSustituto, setActiveTab, notation, seguirEnCifrado, showAnalisisAcordes, scrollContainerRef, activeTab, autoScroll, setCopiedText, pantallaCompleta, alternarPantallaCompleta, isGeneratingAi, setShowStructureUploadModal, setShowShareModal, setShowMetronomeModal, setShowTunerModal, setTranspose, metronomo, setNotation, showChordDiagrams, setShowChordDiagrams, copiedText, aiSuccessMsg, setSeguirEnCifrado, vistaAcordes, setVistaAcordes, showShareModal, showMetronomeModal, showTunerModal, oidoOculto, showStructureUploadModal, audioUrl, audioCurrentTime, isPlayingAudio, handleToggleAudio, handleRestartAudio, formatAudioTime, audioDuration, handleSeekAudio, stems, iris, separarConIris, modoEscucha, setModoEscucha, miId, setMiPistaId, velocidad, setVelocidad, audioSigueTono, setAudioSigueTono, bucle, marcarBucle, limpiarBucle, tomas, tomaActivaId, setTomaActivaId, pistasSonando, ajustesPistas, setAjustesPistas, grabacion, guardandoIdea, guardarIdea, setMasControles, masControles, audioRef, setAudioCurrentTime, setAudioDuration, setIsPlayingAudio, handleAnalyzeChordsFromAudio, handleGenerateWithAi, handleCorregirAcordes, pedirProfesor, handleSaveEdits, handleCopyChords, alineacion, armonia, estiloArmonia, nombreTonalidadVista, vibrarAlCambiar, alternarVibracion, cambiarEstiloArmonia, funcionesPresentes, acordesPorFuncion, processedText, lineasConLetra, letraTranscrita, letraActiva, sincronizado, tiemposAcordes, acordeActivo, uniqueChords, contextoAcordes, acordeSonando };
}
