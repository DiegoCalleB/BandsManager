/**
 * Resumen del clip seleccionado (título, rango y puntuación).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Resumen del clip seleccionado (título, rango y puntuación).
 * @returns Sección de interfaz.
 */
export function ClipSummaryHeader() {
  const { highlights, selectedHighlightIndex, setHighlights, textTitle } = useReelsCenter();
  return (
    <>
      {/* Selected Clip summary header */}
      <div
        className={`p-3 rounded-[var(--r-m)] flex justify-between items-center gap-3 bg-[var(--surface)]`}
      >
        <div className="space-y-0.5 flex-1">
          <span className="text-micro font-sans text-[var(--ink-2)]">
            TÍTULO DEL CORTE (EDITABLE):
          </span>
          <input data-raw
            type="text"
            value={
              highlights[selectedHighlightIndex]?.title || ""
            }
            onChange={(e) => {
              const val = e.target.value;
              setHighlights((prev) =>
                prev.map((clip, idx) =>
                  idx === selectedHighlightIndex
                    ? { ...clip, title: val }
                    : clip,
                ),
              );
            }}
            className={`w-full bg-transparent text-xs font-bold font-sans -dashed focus:outline-none py-0.5 ${textTitle}`}
            placeholder="Escribe un título para este corte…"
          />
        </div>
        <span
          className={`text-xs font-sans font-bold px-2.5 py-1 rounded shrink-0 bg-[var(--acc)]/10 text-[var(--ink)]`}
        >
          {highlights[selectedHighlightIndex]?.range}
        </span>
      </div>
    </>
  );
}
