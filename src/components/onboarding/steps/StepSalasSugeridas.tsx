import React from "react";
import { MapPin, Check } from "lucide-react";
import { Button, Chip, EmptyState, Skeleton } from "../../ui";
import { useSalasSugeridasStep } from "../wizard/hooks/useSalasSugeridasStep";
import type { SugerenciaSala } from "../../../services/apiCatalogo";

interface StepSalasSugeridasProps {
  /** Ciudad base y género que la banda ha escrito en el paso de identidad. */
  city: string;
  genre: string;
}

const NIVEL: Record<SugerenciaSala["nivel"], { etiqueta: string; tono: "ok" | "neutral" } | null> = {
  verificada: { etiqueta: "Verificada", tono: "ok" },
  probable: { etiqueta: "Probable", tono: "ok" },
  sin_verificar: null,
};

function resumenDeSala(s: SugerenciaSala): string {
  return [s.ciudad, s.aforo ? `${s.aforo} personas` : null, s.genero].filter(Boolean).join(" · ");
}

export const StepSalasSugeridas: React.FC<StepSalasSugeridasProps> = ({ city, genre }) => {
  const { sugerencias, cargando, fallo, elegidas, alternar, anadir, anadiendo, informe, errorAlta, reintentar } = useSalasSugeridasStep(city, genre);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-1">
        <MapPin className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">Salas para empezar</h3>
      </div>

      <p className="text-xs text-[var(--ink-2)] text-pretty">
        Otras bandas ya han llamado a estas puertas. Elige las que te encajen y las pasamos a tu agenda con su contacto; el primer correo lo apruebas tú.
      </p>

      {informe && informe.anadidas > 0 && (
        <p role="status" className="rounded-[var(--r-m)] bg-[var(--ok-soft)] px-3.5 py-2.5 text-sm text-[var(--ok)]">
          {informe.anadidas === 1 ? "1 sala" : `${informe.anadidas} salas`} en tu agenda. Ya puedes seguir.
          {informe.limiteAlcanzado && " Tu plan no admite más por ahora."}
        </p>
      )}
      {informe && informe.anadidas === 0 && informe.limiteAlcanzado && (
        <p role="status" className="rounded-[var(--r-m)] bg-[var(--sunken)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
          Tu plan no admite más salas por ahora.
        </p>
      )}
      {errorAlta && (
        <p role="alert" className="rounded-[var(--r-m)] bg-[var(--alert-soft)] px-3.5 py-2.5 text-sm text-[var(--alert)]">
          {errorAlta}
        </p>
      )}

      {cargando ? (
        <ul className="space-y-2" aria-busy="true" aria-label="Buscando salas">
          {[0, 1, 2].map((i) => (
            <li key={i}><Skeleton className="h-16" /></li>
          ))}
        </ul>
      ) : fallo ? (
        <EmptyState compact title="No hemos podido abrir la lista de salas." description="Puedes seguir sin ella y añadirlas más tarde desde el chat." action={<Button size="sm" variant="neutral" onClick={() => void reintentar()}>Reintentar</Button>} />
      ) : sugerencias.length === 0 ? (
        <EmptyState compact title="Aún no tenemos salas para tu zona." description="Las irás encontrando tú con el Scout, y las que otras bandas descubran te aparecerán aquí." />
      ) : (
        <ul className="space-y-2">
          {sugerencias.map((s) => {
            const elegida = elegidas.has(s.id);
            const nivel = NIVEL[s.nivel];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={elegida}
                  onClick={() => alternar(s.id)}
                  className={`flex w-full items-start gap-3 rounded-[var(--r-m)] p-3.5 text-left transition-ui ${elegida ? "bg-[var(--acc-soft)]" : "bg-[var(--surface)] hover:bg-[var(--sunken)]"}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--r-pill)] ${elegida ? "bg-[var(--acc)] text-[var(--on-acc)]" : "bg-[var(--sunken)]"}`}>
                    {elegida && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="block truncate text-sm font-semibold text-[var(--ink)]">{s.nombre}</span>
                    <span className="block truncate text-xs text-[var(--ink-2)]">{resumenDeSala(s)}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {nivel && <Chip tone={nivel.tono}>{nivel.etiqueta}</Chip>}
                      {s.motivos.map((m) => (
                        <Chip key={m} tone={m === "En tu ciudad" ? "acc" : "neutral"}>{m}</Chip>
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!cargando && !fallo && sugerencias.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--ink-2)] tabular-nums">{elegidas.size === 0 ? "Sin elegir todavía" : `${elegidas.size} elegida${elegidas.size === 1 ? "" : "s"}`}</span>
          <Button variant="primary" size="sm" disabled={elegidas.size === 0 || anadiendo} onClick={() => void anadir()}>
            {anadiendo ? "Añadiendo…" : "Añadir a mi agenda"}
          </Button>
        </div>
      )}
    </div>
  );
};
