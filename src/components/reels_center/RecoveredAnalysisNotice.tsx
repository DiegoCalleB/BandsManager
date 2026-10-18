/**
 * Aviso de análisis guardado recuperado para el mismo vídeo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2 } from "lucide-react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Aviso de análisis guardado recuperado para el mismo vídeo.
 * @returns Sección de interfaz.
 */
export function RecoveredAnalysisNotice() {
  const { loadedFromSaveAt, highlights, isAnalyzing } = useReelsCenter();
  return (
    <>
      {/* Aviso de análisis recuperado: sin esto, el usuario no sabría por qué ya hay
 clips sugeridos sin haber pulsado"Analizar" en esta visita. */}
      {loadedFromSaveAt && highlights.length > 0 && !isAnalyzing && (
      <div
        className={`p-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 bg-[var(--ok)]/10 text-[var(--ok)]`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>
          Recuperado el análisis guardado de este vídeo (
          {new Date(loadedFromSaveAt).toLocaleString("es-ES", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          ). Pulsa “Analizar highlights con IA” si quieres uno nuevo.
        </span>
      </div>
      )}
    </>
  );
}
