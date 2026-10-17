import { Onda } from "../ui/Onda";
import type { RazonDelTramo } from "./razonDelTramo";

/** Explica en pantalla por qué se eligió el corte seleccionado: frase + señales en la Onda. */
export function RazonDelTramoPanel({ razon }: { razon: RazonDelTramo }) {
  return (
    <div className="rounded-[var(--r-m)] bg-[var(--sunken)] p-3.5 flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-sans font-semibold text-[var(--ink)]">Por qué este tramo</p>
        <p className="text-micro font-sans leading-snug text-[var(--ink-2)]">{razon.motivo}</p>
        <p className="text-micro font-sans text-[var(--ink-3)]">
          Potencial combinado <span className="tabular-nums text-[var(--acc-ink)]">{razon.puntuacion}</span>/100 · pesó más el {razon.principal.etiqueta.toLowerCase()}
        </p>
      </div>
      <Onda
        height={56}
        barWidth={14}
        gap={10}
        showValues
        animated={false}
        data={razon.senales.map((s, i) => ({ label: s.etiqueta, value: s.valor, color: i === 0 ? "var(--acc)" : "var(--ok)" }))}
      />
    </div>
  );
}
