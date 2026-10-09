export interface SetlistMetrics {
  totalSeconds: number;
  formattedTime: string;
  songCount: number;
  eventCount: number;
  blockCount: number;
  avgBpm: number;
}
import { Chip } from "../ui";
import { Timer, Gauge, ChevronDown, MessageCircle, Layers } from "lucide-react";

export interface SetlistStatsSummaryBarProps {
  metrics: SetlistMetrics;
  profileLabel: string;
  showStats: boolean;
  onToggleShowStats: () => void;
}

export const SetlistStatsSummaryBar: React.FC<SetlistStatsSummaryBarProps> = ({
  metrics,
  profileLabel,
  showStats,
  onToggleShowStats,
}) => {
  return (
    <>
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-1.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
        {/* Resumen en una línea y botón asistente IA */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto px-1.5">
          <button
            type="button"
            onClick={onToggleShowStats}
            className="flex items-center gap-1.5 text-xs hover:opacity-80 transition cursor-pointer text-[var(--ink-2)]"
            title={
              showStats
                ? "Ocultar métricas secundarias"
                : "Ver interludios, bloques y perfil de dinámica"
            }
          >
            <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)] tabular-nums">
              <Timer className="size-4 text-[var(--ink-2)]" aria-hidden="true" />
              {metrics.formattedTime}
            </span>
            <span className="text-[var(--ink-2)]" aria-hidden="true">
              ·
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--acc-ink)] tabular-nums">
              <Gauge className="size-4" aria-hidden="true" />
              {metrics.avgBpm} BPM
            </span>
            <ChevronDown
              className={`size-4 text-[var(--ink-2)] transition-transform ${
                showStats ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Métricas secundarias, solo si se piden */}
      {showStats && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <Chip>
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {metrics.eventCount} interludios
          </Chip>
          <Chip>
            <Layers className="size-3.5" aria-hidden="true" />
            {metrics.blockCount} bloques
          </Chip>
          <Chip tone="acc">{profileLabel}</Chip>
        </div>
      )}
    </>
  );
};
