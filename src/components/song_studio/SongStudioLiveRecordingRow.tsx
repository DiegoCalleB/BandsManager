import { LiveMicWaveformCanvas } from './LiveMicWaveformCanvas';
/**
 * Fila de la pista que se está grabando en directo
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Square } from "lucide-react";
import { AudioTrack, SongAudioIdea } from "../../types";
import { Button } from "../ui";
import { useSongStudio } from "./SongStudioContext";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface SongStudioLiveRecordingRowProps {
  idea: SongAudioIdea;
  tracks: AudioTrack[];
}

/**
 * Fila de la pista que se está grabando en directo
 * @param props Estado y callbacks del contenedor ({@link SongStudioLiveRecordingRowProps}).
 * @returns Sección de interfaz.
 */
export function SongStudioLiveRecordingRow({ idea, tracks }: SongStudioLiveRecordingRowProps) {
  const { isRecordingTrack, recordingTrackIdeaId, newTrackName, formatTime, recordingTrackTime, stopRecordingTrackOverdub, activeRecordingStream, studioAudioCtxRef } = useSongStudio();
  return (
    <>
      {/* CUBASE LIVE RECORDING TRACK ROW */}
      {isRecordingTrack && recordingTrackIdeaId === idea.id && (
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/5 flex flex-col gap-2.5/10/60 ring-2 ring-[var(--alert)]/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <span className="w-6 h-6 rounded bg-[var(--alert)] text-[var(--on-alert)] font-sans text-xs font-bold flex items-center justify-center shrink-0 shadow">
                {tracks.length + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[var(--ink)] font-sans">
                    {newTrackName.trim() || `Pista ${tracks.length + 1}`}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--alert)] text-[var(--on-alert)] font-sans text-micro font-extrabold flex items-center gap-1 shadow">
                    <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--surface)] " /> GRABANDO
                    ONDAS EN DIRECTO…
                  </span>
                </div>
                <span className="text-micro font-sans text-[var(--alert)]/80 block mt-0.5">
                  Grabación estilo Cubase sobre la barra de la pista
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-sm font-sans font-bold text-[var(--alert)] bg-[var(--sunken)] px-3 py-1 rounded-[var(--r-s)] shadow">
                {formatTime(recordingTrackTime)}
              </div>

              <Button
                variant="danger"
                size="xs"
                type="button"
                onClick={stopRecordingTrackOverdub}
                className="items-center gap-1.5 shrink-0"
                title="Detener y guardar pista en la idea"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener y guardar</span>
              </Button>
            </div>
          </div>

          {/* Live Waveform Timeline Bar across the track lane */}
          <div className="w-full h-12 relative rounded bg-[var(--sunken)] p-0.5 overflow-hidden">
            <LiveMicWaveformCanvas
              stream={activeRecordingStream}
              audioCtxRef={studioAudioCtxRef}
              isRecording={isRecordingTrack}
              color="#ef4444"
              height={44}
            />
          </div>
        </div>
      )}
    </>
  );
}
