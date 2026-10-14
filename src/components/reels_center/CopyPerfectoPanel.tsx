/**
 * "Mejorar copy": enseña el candidato que eligió el juez y dos alternativas, y aplica el que
 * escoja la banda. Va bajo el editor de copy; sin resultados solo ocupa un botón.
 */
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "../ui";
import type { CandidatoCopyApi } from "./reelsApiTypes";

/** Nombre legible de cada arquetipo de gancho del servidor. */
const ARQUETIPO: Record<string, string> = {
  curiosidad: "Curiosidad",
  contraste: "Contraste",
  especificidad: "Detalle concreto",
  pov: "Punto de vista",
  pregunta_real: "Pregunta real",
  detras_de_escena: "Detrás de escena",
  original: "El tuyo"
};

interface Props {
  mejorando: boolean;
  opciones: CandidatoCopyApi[];
  motivo: string;
  error: string;
  onMejorar: () => void;
  onAplicar: (opcion: CandidatoCopyApi) => void;
}

export function CopyPerfectoPanel({ mejorando, opciones, motivo, error, onMejorar, onAplicar }: Props) {
  return (
    <div className="space-y-2">
      <Button variant="neutral" size="xs" type="button" onClick={onMejorar} disabled={mejorando} className="items-center gap-1.5" title="Genera varias versiones, descarta las que rompen las reglas de las redes y elige la mejor">
        {mejorando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[var(--acc-ink)]" />}
        <span>{mejorando ? "Probando versiones…" : "Mejorar copy"}</span>
      </Button>

      {error && <p role="alert" className="text-xs text-[var(--alert)]">{error}</p>}

      {opciones.length > 0 && (
        <ul className="space-y-1.5" aria-label="Versiones del copy">
          {opciones.map((o, i) => (
            <li key={`${o.arquetipo}-${i}`} className="rounded-[var(--r-m)] bg-[var(--sunken)] px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-micro text-[var(--ink-2)]">
                  {i === 0 ? <strong className="text-[var(--acc-ink)]">Recomendada · </strong> : null}
                  {ARQUETIPO[o.arquetipo] || o.arquetipo}
                </span>
                <Button variant={i === 0 ? "primary" : "neutral"} size="xs" type="button" onClick={() => onAplicar(o)}>
                  Usar esta
                </Button>
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">{o.copy.hookText}</p>
              <p className="text-xs text-[var(--ink-2)] line-clamp-2">{o.copy.recommendedCopy}</p>
              {i === 0 && motivo && <p className="text-micro text-[var(--ink-3)]">{motivo}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
