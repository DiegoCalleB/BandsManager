/**
 * Consejos de IA sobre el mejor momento y la estrategia de publicación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Clock } from "lucide-react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Consejos de IA sobre el mejor momento y la estrategia de publicación.
 * @returns Sección de interfaz.
 */
export function RecommendationTips() {
  const { optimalTime } = useReelsCenter();
  return (
    <>
      {/* Recommendation Tips */}
      {optimalTime && (
        <div
          className={`p-3 rounded-[var(--r-m)] flex gap-3 items-start text-xs leading-relaxed bg-[var(--acc)]/5 text-[var(--ink)]`}
        >
          <Clock
            className={`w-4.5 h-4.5 mt-0.5 shrink-0 text-[var(--acc)]`}
          />
          <div className="space-y-0.5">
            <span
              className={`font-sans text-micro font-bold text-[var(--acc)]`}
            >
              ¿Por qué este horario?
            </span>
            <p
              className={`font-sans text-[var(--ink-2)]`}
            >
              {optimalTime.reason}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
