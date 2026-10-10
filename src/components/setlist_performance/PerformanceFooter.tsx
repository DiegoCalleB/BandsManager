/**
 * Barra inferior: tono y tempo, navegación y siguiente tema.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronLeft,ChevronRight } from "lucide-react";
import { BarraSeguimientoEnsayo } from "../ensayos/BarraSeguimientoEnsayo";
import { ShowIcon } from "../ui/ShowIcon";
import { itemLabel } from "./performanceModel";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Barra inferior: tono y tempo, navegación y siguiente tema.
 * @returns Sección de interfaz.
 */
export function PerformanceFooter() {
  const { glareMode, seguimientoEnsayo, currentItem, isBlock, showScannedSheet, currentSong, setLiveTransposeOffset, transposedKey, liveTransposeOffset, effectiveTranspose, handlePrev, isFirst, allItems, setCurrentIndex, currentIndex, songs, handleNext, isLast, nextItem } = useSetlistPerformance();
  return (
    <>
      <div
  className={`shrink-0 px-3 sm:px-4 py-2 space-y-2 z-20 ${glareMode ? "bg-gradient-to-t from-white to-white/0" : "bg-gradient-to-t from-black to-[var(--sunken)]/0"}`}
      >
  {seguimientoEnsayo && (
    <BarraSeguimientoEnsayo
      agenda={seguimientoEnsayo.agenda}
      itemId={currentItem?.id}
      onUpdateRehearsal={seguimientoEnsayo.onUpdateRehearsal}
    />
  )}

  {!isBlock && !showScannedSheet && currentSong?.tonalidad && (
    <div className="flex items-center justify-center gap-2 text-xs">
      <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-0.5 rounded">
      <button
        type="button"
        onClick={() => setLiveTransposeOffset((v) => v - 1)}
        className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold cursor-pointer"
        title="Bajar 1 semitono (-1)"
      >
        -
      </button>
      <span className="text-[var(--acc)] font-bold font-sans">
        <ShowIcon inline emoji="🎯" />{transposedKey}
      </span>
      <button
        type="button"
        onClick={() => setLiveTransposeOffset((v) => v + 1)}
        className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold cursor-pointer"
        title="Subir 1 semitono (+1)"
      >
        +
      </button>
      {liveTransposeOffset !== 0 && (
        <button
          type="button"
          onClick={() => setLiveTransposeOffset(0)}
          className="ml-1 text-micro px-1 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 cursor-pointer"
          title="Restablecer tono"
        >
          {liveTransposeOffset > 0
            ? `+${liveTransposeOffset}`
            : liveTransposeOffset}{" "}
          ⟲
        </button>
      )}
      </div>
      {effectiveTranspose !== 0 && (
      <span className="text-[var(--ink-2)] font-sans text-xs hidden sm:inline">
        (original {currentSong?.tonalidad})
      </span>
      )}
    </div>
  )}

  <div className="flex items-center justify-between gap-3">
    <button
      onClick={handlePrev}
      disabled={isFirst}
      className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-[var(--r-pill)] transition flex items-center gap-1.5 ${
      glareMode
        ? "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]"
        : "bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink)]"
      }`}
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="hidden sm:inline text-xs">Anterior</span>
    </button>

    {/* Page dots: quick glance at where you are in the setlist. Los bloques se marcan
 distinto (cuadrado en vez de punto) para ver de un vistazo dónde hay una pausa/
 presentación entre canciones. */}
    <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto shrink-0 px-2 max-w-full">
      {allItems.map((it, i) => (
      <button
        key={it.id}
        onClick={() => setCurrentIndex(i)}
        className={`shrink-0 transition-ui ${it.tipoItem === "bloque" ? "rounded-[var(--r-s)]" : "rounded-[var(--r-pill)]"} ${
          i === currentIndex
            ? "w-5 h-1.5 bg-[var(--acc)]"
            : it.tipoItem === "bloque"
              ? "w-1.5 h-1.5 bg-[var(--tentative)] hover:bg-[var(--tentative)]"
              : glareMode
                ? "w-1.5 h-1.5 bg-[var(--sunken)] hover:bg-[var(--sunken)]"
                : "w-1.5 h-1.5 bg-[var(--ink)]/25 hover:bg-[var(--ink)]/50"
        }`}
        title={itemLabel(it, songs)}
      />
      ))}
    </div>

    <button
      onClick={handleNext}
      disabled={isLast}
      className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-[var(--r-pill)] transition flex items-center gap-1.5 ${
      glareMode
        ? "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]"
        : "bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink)]"
      }`}
    >
      <span className="hidden sm:inline text-xs">Siguiente</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>

  {nextItem && (
    <p
      className={`text-center text-xs font-sans truncate ${glareMode ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"}`}
    >
      Siguiente:{" "}
      <span
      className={
        glareMode ? "text-[var(--ink)]" : "text-[var(--ink-2)]"
      }
      >
      {itemLabel(nextItem, songs)}
      </span>
      {nextItem.tipoItem === "cancion" &&
      songs.find((s) => s.id === nextItem.songId)?.tonalidad && (
        <span>
          {" "}
          · {songs.find((s) => s.id === nextItem.songId)?.tonalidad}
        </span>
      )}
    </p>
  )}
      </div>
    </>
  );
}
