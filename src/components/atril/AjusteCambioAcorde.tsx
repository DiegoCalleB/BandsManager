/**
 * Mueve un tiempo el cambio de acorde de la casilla elegida en la rejilla de compases. Se corrige una
 * vez y queda para toda la banda (se guarda en la canción).
 */
import { ChevronLeft, ChevronRight } from "lucide-react";

const PILDORA = "px-3 py-2 min-h-11 rounded-[var(--r-pill)] bg-[var(--surface)] text-xs font-bold text-[var(--ink)] cursor-pointer transition-ui hover:bg-[var(--acc-soft)] active:bg-[var(--acc-soft)] disabled:opacity-40 disabled:cursor-default";

interface Props {
  /** Acorde ya formateado de la casilla elegida. */
  acorde: string;
  onMover: (direccion: -1 | 1) => void;
  /** Cambios iguales del bloque que se pueden mover igual que el último; con 0 no se ofrece. */
  hermanos?: number;
  onHermanos?: () => void;
  onCerrar: () => void;
}

/**
 * Barra con el acorde elegido y los botones para adelantarlo o retrasarlo un tiempo.
 * @returns Sección de interfaz.
 */
export function AjusteCambioAcorde({ acorde, onMover, hermanos = 0, onHermanos, onCerrar }: Props) {
  return (
    <div role="group" aria-label={`Mover el cambio a ${acorde}`} className="flex flex-wrap items-center gap-1.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] px-3 py-2">
      <span className="text-sm font-bold text-[var(--acc-ink)] mr-1">{acorde} entra mal</span>
      <button type="button" className={PILDORA} onClick={() => onMover(-1)} aria-label="Adelantar el cambio un tiempo"><ChevronLeft aria-hidden="true" className="inline w-4 h-4 -ml-1" />1 tiempo</button>
      <button type="button" className={PILDORA} onClick={() => onMover(1)} aria-label="Retrasar el cambio un tiempo">1 tiempo<ChevronRight aria-hidden="true" className="inline w-4 h-4 -mr-1" /></button>
      {hermanos > 0 && onHermanos && (
        <button type="button" className={`${PILDORA} text-[var(--acc-ink)]`} onClick={onHermanos}>
          Igual en {hermanos} {hermanos === 1 ? "cambio más" : "cambios más"} del bloque
        </button>
      )}
      <button type="button" className={`${PILDORA} text-[var(--ink-2)]`} onClick={onCerrar}>Listo</button>
    </div>
  );
}
