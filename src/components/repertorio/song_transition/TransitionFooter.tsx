/**
 * Pie de acciones: insertar chapa entre los temas, invertirlos o cerrar.
 */
import { ArrowLeftRight, MessageSquarePlus } from "lucide-react";
import { Button } from "../../ui";
import { useSongTransition } from "./SongTransitionContext";

/** Pie de acciones: insertar chapa entre los temas, invertirlos o cerrar. */
export function TransitionFooter() {
  const { itemA, indexA, indexB, onInsertInterludio, onSwapSongs, runAndClose, onClose } = useSongTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 px-3.5 py-2 bg-[var(--sunken)] shrink-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {onInsertInterludio && itemA && (
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={() => runAndClose(() => onInsertInterludio(itemA.id))}
            className="items-center gap-1"
          >
            <MessageSquarePlus className="w-3 h-3" />
            <span>Insertar chapa</span>
          </Button>
        )}

        {onSwapSongs && (
          <button
            type="button"
            onClick={() => runAndClose(() => onSwapSongs(indexA, indexB))}
            className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Invertir (A ⇄ B)</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="px-3.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-xs font-bold transition cursor-pointer"
      >
        Cerrar
      </button>
    </div>
  );
}
