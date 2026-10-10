/**
 * Banner descartable con el último error del flujo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Banner descartable con el último error del flujo.
 * @returns Sección de interfaz.
 */
export function ConcertErrorBanner() {
  const { errorMessage, setErrorMessage } = useLiveConcertAlbum();
  return (
    <>
      {errorMessage && (
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--alert)]/10 text-[var(--alert)] text-sm flex items-center justify-between">
          <span><ShowIcon inline emoji="⚠️" />{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="font-bold text-xs hover:underline"
          >
            Descartar
          </button>
        </div>
      )}
    </>
  );
}
