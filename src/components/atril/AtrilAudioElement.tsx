/**
 * Elemento de audio oculto para la reproducción dentro del Atril.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useAtril } from "./AtrilContext";

/**
 * Elemento de audio oculto para la reproducción dentro del Atril.
 * @returns Sección de interfaz.
 */
export function AtrilAudioElement() {
  const { audioUrl, audioRef, setAudioCurrentTime, setAudioDuration, setIsPlayingAudio } = useAtril();
  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setAudioCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setAudioDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlayingAudio(false);
            setAudioCurrentTime(0);
          }}
          onPause={() => setIsPlayingAudio(false)}
          onPlay={() => setIsPlayingAudio(true)}
        />
      )}
    </>
  );
}
