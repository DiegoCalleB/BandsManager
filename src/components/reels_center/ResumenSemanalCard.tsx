/** Lo que ha funcionado esta semana: los Reels más vistos de nuevo y qué probar después. */
import { EmptyState } from "../ui/EmptyState";
import { Onda } from "../ui/Onda";
import type { ResumenSemanalResponse } from "./reelsApiTypes";
import { useResumenSemanal } from "./hooks/useResumenSemanal";

const veces = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });

export function ResumenSemanalView({ resumen }: { resumen: ResumenSemanalResponse }) {
  return (
    <section aria-label="Lo que ha funcionado esta semana" className="rounded-[var(--r-l)] bg-[var(--surface)] p-5 space-y-4">
      <h3 className="text-sm font-bold font-display text-[var(--ink)]">Lo que ha funcionado esta semana</h3>
      {resumen.mejores.length === 0 ? (
        <EmptyState compact title="Esta semana la sala ha estado callada." description="Cuando tus Reels lleven un día publicados verás aquí cuáles gustaron más." />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <ol className="flex-1 min-w-0 space-y-2">
              {resumen.mejores.map((m, i) => (
                <li key={m.postId} className="flex items-baseline gap-2 text-xs">
                  <span className="tabular-nums text-[var(--ink-3)]">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate text-[var(--ink)]">{m.texto}</span>
                  <span className="shrink-0 tabular-nums text-[var(--acc-ink)]">{veces(m.rewatch)} {m.rewatch === 1 ? "vez vista" : "veces vista"}</span>
                </li>
              ))}
            </ol>
            <Onda height={56} barWidth={14} gap={10} animated={false} showValues valueFormatter={veces}
              data={resumen.mejores.map((m, i) => ({ label: `${i + 1}`, value: m.rewatch, color: i === 0 ? "var(--acc)" : "var(--ok)" }))} />
          </div>
          {resumen.patron && <p className="text-xs text-[var(--ink)]">{resumen.patron}</p>}
        </>
      )}
      <p className="text-xs text-[var(--ink-2)]">{resumen.proximo}</p>
    </section>
  );
}

export function ResumenSemanalCard() {
  const { resumen } = useResumenSemanal();
  return resumen ? <ResumenSemanalView resumen={resumen} /> : null;
}
