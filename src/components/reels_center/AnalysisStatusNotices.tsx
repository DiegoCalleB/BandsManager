/**
 * Avisos de error del análisis o de que la IA no intervino (cortes de respaldo).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle } from "lucide-react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Avisos de error del análisis o de que la IA no intervino (cortes de respaldo).
 * @returns Sección de interfaz.
 */
export function AnalysisStatusNotices() {
  const { analysisError, analysisNotice } = useReelsCenter();
  return (
    <>
      {analysisError && (
      <div className="p-3 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs flex gap-2 items-center">
        <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
        <span>{analysisError}</span>
      </div>
      )}

      {/* Cuando la IA no ha intervenido lo decimos: antes los cortes de respaldo se
 presentaban como si los hubiera elegido el modelo. */}
      {!analysisError && analysisNotice && (
      <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-[var(--ink)] text-xs flex gap-2 items-start">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{analysisNotice}</span>
      </div>
      )}
    </>
  );
}
