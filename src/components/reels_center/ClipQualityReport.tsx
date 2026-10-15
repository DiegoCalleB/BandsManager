/**
 * Informe del control de calidad del último clip renderizado (Fase 6 del plan de Reels).
 * Va junto a "Publicar" porque es lo que decide si el clip puede salir solo.
 */
import { AlertCircle, Check } from "lucide-react";
import type { InformeCalidadClip } from "./reelsApiTypes";

interface Props {
  /** undefined = aún no hay render; null = el servidor no pudo medirlo. */
  informe: InformeCalidadClip | null | undefined;
}

export function ClipQualityReport({ informe }: Props) {
  if (informe === undefined) return null;

  if (informe === null) {
    return (
      <p role="status" className="rounded-[var(--r-m)] bg-[var(--sunken)] px-3 py-2 text-xs text-[var(--ink-2)]">
        No se ha podido revisar la calidad de este clip. Puedes descargarlo, pero no se publicará solo.
      </p>
    );
  }

  const limpio = informe.aprobado && informe.avisos.length === 0;
  return (
    <div role="status" className="rounded-[var(--r-m)] bg-[var(--sunken)] px-3 py-2 text-xs text-[var(--ink-2)] space-y-1">
      <p className={`flex items-center gap-1.5 font-semibold ${informe.aprobado ? "text-[var(--ink)]" : "text-[var(--alert)]"}`}>
        {informe.aprobado ? <Check className="w-3.5 h-3.5 text-[var(--acc-ink)]" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {limpio ? "Clip revisado: imagen, sonido y formato en orden." : informe.aprobado ? "Clip revisado, con avisos:" : "Este clip no se publicará solo:"}
      </p>
      {informe.bloqueantes.map((p) => (
        <p key={`b-${p.codigo}`} className="text-[var(--alert)]">{p.mensaje}</p>
      ))}
      {informe.avisos.map((p) => (
        <p key={`a-${p.codigo}`}>{p.mensaje}</p>
      ))}
    </div>
  );
}
