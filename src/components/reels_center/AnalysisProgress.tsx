/**
 * Indicador de progreso con los pasos del análisis en curso.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../ui/ShowIcon";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Indicador de progreso con los pasos del análisis en curso.
 * @returns Sección de interfaz.
 */
export function AnalysisProgress() {
  const { isAnalyzing, loadingStep, getLoadingSteps } = useReelsCenter();
  return (
    <>
      {/* Loading indicator with detailed analytical logs */}
      {isAnalyzing && (
      <div
        className={`p-4 rounded-[var(--r-m)] space-y-3 bg-[var(--sunken)]`}
      >
        <div className="flex justify-between items-center text-micro font-sans">
          <span className={`font-bold text-[var(--acc)]`}>
            Estado del análisis:
          </span>
          <span className="text-[var(--ink-2)]">
            Paso {loadingStep + 1} de {getLoadingSteps().length}
          </span>
        </div>
        <p
          className={`text-xs font-sans leading-normal text-[var(--ink-2)]`}
        >
          <ShowIcon inline emoji="⚡️" />{" "}
          <span className={"text-[var(--acc)]"}>
            {getLoadingSteps()[loadingStep]}
          </span>
        </p>
        <div
          className={`w-full h-1.5 rounded-[var(--r-pill)] overflow-hidden bg-[var(--surface)]`}
        >
          <div
            className={`h-full transition-ui duration-300 bg-[var(--acc)] `}
            style={{
              width: `${((loadingStep + 1) / getLoadingSteps().length) * 100}%`,
            }}
          />
        </div>
      </div>
      )}
    </>
  );
}
