/**
 * Botón final que trocea el concierto en servidor y crea el disco.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { RefreshCw, Scissors } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Botón final que trocea el concierto en servidor y crea el disco.
 * @returns Sección de interfaz.
 */
export function GenerateAlbumButton() {
  const { handleProcessAndSlice, isProcessing, processingStatus } = useLiveConcertAlbum();
  return (
    <>
      {/* Action Button: Trocear y Generar Disco */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleProcessAndSlice}
          disabled={isProcessing}
          className="px-6 py-3 rounded-[var(--r-m)] bg-[var(--ok)]  hover:bg-[var(--ok)] font-extrabold text-[var(--on-ok)] text-sm flex items-center gap-2 transition-ui"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />{" "}
              {processingStatus}
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" /> <ShowIcon inline emoji="✂️" />Trocear concierto &
              crear disco (.mp3)
            </>
          )}
        </button>
      </div>
    </>
  );
}
