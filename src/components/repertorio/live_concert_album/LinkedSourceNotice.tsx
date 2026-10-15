/**
 * Aviso de que el audio ya está vinculado, con opción de reemplazar el archivo local.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2 } from "lucide-react";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Aviso de que el audio ya está vinculado, con opción de reemplazar el archivo local.
 * @returns Sección de interfaz.
 */
export function LinkedSourceNotice() {
  const { audioAvailable, analyzedSourcePath, handleAttachLocalAudioFile, isLinkingLocalFile } = useLiveConcertAlbum();
  return (
    <>
      {audioAvailable && analyzedSourcePath && (
        <div className="px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ink-2)] text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
            <span>
              Audio maestro vinculado:{" "}
              <strong>{analyzedSourcePath.split("/").pop()}</strong>.
              Muestras de audio y transcriptor listo.
            </span>
          </span>
          <label className="text-xs font-bold text-[var(--ok)] hover:underline cursor-pointer ml-2 shrink-0">
            <span>Cambiar archivo</span>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleAttachLocalAudioFile}
              disabled={isLinkingLocalFile}
              className="hidden"
            />
          </label>
        </div>
      )}
    </>
  );
}
