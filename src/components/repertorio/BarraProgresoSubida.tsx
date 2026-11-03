import { RefreshCw } from "lucide-react";
import type { ProgresoSubida } from "../../utils/subidaConProgreso";

interface Props {
  current: number;
  total: number;
  currentName: string;
  progreso: ProgresoSubida | null;
}

/** Progreso de la subida de pistas: pista X de Y, y qué pasa ahora con la actual (enviando o procesando en el servidor). */
export function BarraProgresoSubida({ current, total, currentName, progreso }: Props) {
  const procesando = progreso?.fase === "procesando";
  const pct = progreso?.pct ?? 0;
  const base = ((Math.max(1, current) - 1) / Math.max(1, total)) * 100;
  const global = Math.min(100, base + (pct / 100) * (100 / Math.max(1, total)));
  return (
    <div className="p-4 rounded-[var(--r-l)] bg-[var(--ink)]/5 space-y-2" role="progressbar" aria-valuenow={Math.round(global)} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between gap-3 text-xs font-sans">
        <span className="flex items-center gap-2 text-[var(--ok)] font-bold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Pista {current} de {total}
          {" · "}
          {procesando ? "Procesando en el servidor (puede tardar si es un WAV grande)…" : `Subiendo ${pct}%`}
        </span>
        <span className="text-[var(--ink-2)] truncate max-w-[200px]">{currentName}</span>
      </div>
      <div className="w-full h-2 bg-[var(--surface)]/80 rounded-[var(--r-pill)] overflow-hidden">
        <div
          className={`h-full bg-[var(--ok)] transition-ui duration-300 rounded-[var(--r-pill)] ${procesando ? "animate-pulse" : ""}`}
          style={{ width: `${global}%` }}
        />
      </div>
    </div>
  );
}
