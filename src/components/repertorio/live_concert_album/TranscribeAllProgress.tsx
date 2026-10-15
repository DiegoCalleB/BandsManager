/**
 * Banner de progreso de la transcripción en lote de todo el concierto.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles } from "lucide-react";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Banner de progreso de la transcripción en lote de todo el concierto.
 * @returns Sección de interfaz.
 */
export function TranscribeAllProgress() {
  const { isTranscribingAll, transcribeAllProgress } = useLiveConcertAlbum();
  return (
    <>
      {/* Bulk Transcription Active Progress Banner */}
      {isTranscribingAll && transcribeAllProgress && (
        <div className="bg-[var(--ok-soft)] p-3.5 rounded-[var(--r-m)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink)]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[var(--ok)] animate-spin shrink-0" />
            <div>
              <div className="font-extrabold text-[var(--ok)] flex items-center gap-1.5">
                <span>Transcribiendo concierto completo con IA</span>
                <span className="text-micro bg-[var(--ok)]/20 text-[var(--ink)] px-2 py-0.5 rounded-[var(--r-pill)] font-sans">
                  {transcribeAllProgress.current} /{" "}
                  {transcribeAllProgress.total}
                </span>
              </div>
              <div className="text-xs text-[var(--ink-2)]/80 truncate max-w-md">
                Pista actual:{" "}
                <span className="font-semibold text-[var(--ink)]">
                  "{transcribeAllProgress.title}"
                </span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-48 bg-[var(--surface)] h-2.5 rounded-[var(--r-pill)] overflow-hidden">
            <div
              className="bg-[var(--ok)]  h-full transition-ui duration-300"
              style={{
                width: `${(transcribeAllProgress.current / transcribeAllProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
