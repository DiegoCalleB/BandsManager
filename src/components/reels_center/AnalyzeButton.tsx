/**
 * Botón que lanza el análisis IA del vídeo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { RefreshCw, Sparkles } from "lucide-react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Botón que lanza el análisis IA del vídeo.
 * @returns Sección de interfaz.
 */
export function AnalyzeButton() {
  const { handleAnalyzeVideo, inputType, selectedFile, youtubeUrl, isAnalyzing } = useReelsCenter();
  return (
    <>
      {/* Analysis Button */}
      <div className="pt-2">
      <button
        id="btn-analyze-video"
        onClick={handleAnalyzeVideo}
        disabled={
          (inputType === "file" ? !selectedFile : !youtubeUrl) ||
          isAnalyzing
        }
        className={`w-full py-3.5 rounded-[var(--r-m)] font-sans text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-ui ${
          (inputType === "file" ? selectedFile : youtubeUrl)
            ? "bg-[var(--ink)] text-[var(--bg)] "
            : "bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed"
        }`}
      >
        {isAnalyzing ? (
          <>
            <RefreshCw
              className={`w-4 h-4 animate-spin text-[var(--acc-ink)]`}
            />
            <span>PROCESANDO METRAJE…</span>
          </>
        ) : (
          <>
            <Sparkles
              className={`w-4 h-4 text-[var(--acc-ink)]`}
            />
            <span>ANALIZAR HIGHLIGHTS CON IA</span>
          </>
        )}
      </button>
      </div>
    </>
  );
}
