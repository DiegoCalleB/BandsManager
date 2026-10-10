/**
 * Acordes detectados del audio con su análisis.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { LineaTiempoAcordes } from "../chords/LineaTiempoAcordes";
import { useAtril } from "./AtrilContext";

/**
 * Acordes detectados del audio con su análisis.
 * @returns Sección de interfaz.
 */
export function DetectedChordsPanel() {
  const { analisisAcordes, showAnalisisAcordes, activeTab, song, audioRef, isPlayingAudio, transpose, notation, isAnalyzingChords, setAudioCurrentTime, handleAnalyzeChordsFromAudio, alineacion, seguirEnCifrado, setSeguirEnCifrado, armonia, estiloArmonia, nombreTonalidadVista, vibrarAlCambiar, alternarVibracion, handleCorregirAcordes, setShowAnalisisAcordes } = useAtril();
  return (
    <>
      {analisisAcordes && showAnalisisAcordes && activeTab === "chords" && (
        <LineaTiempoAcordes
          analisis={analisisAcordes}
          bpm={song.bpm}
          audioRef={audioRef}
          isPlaying={isPlayingAudio}
          transpose={transpose}
          notation={notation}
          isAnalyzing={isAnalyzingChords}
          onSeek={(t) => {
            if (audioRef.current) audioRef.current.currentTime = t;
            setAudioCurrentTime(t);
          }}
          onReanalizar={() => handleAnalyzeChordsFromAudio(true)}
          sincronizacion={alineacion ? { calidad: alineacion.calidad, desplazamiento: alineacion.desplazamiento, usable: alineacion.usable } : null}
          seguir={seguirEnCifrado}
          onSeguir={setSeguirEnCifrado}
          armonia={armonia}
          estilo={estiloArmonia}
          nombreTonalidad={nombreTonalidadVista}
          vibrar={vibrarAlCambiar}
          onVibrar={alternarVibracion}
          onCorregir={handleCorregirAcordes}
          onClose={() => setShowAnalisisAcordes(false)}
        />
      )}
    </>
  );
}
