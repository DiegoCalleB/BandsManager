/**
 * Tarjeta de fans registrados (base de datos y formulario Únete).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Heart } from "lucide-react";
import { useMetrics } from "./MetricsContext";

/**
 * Tarjeta de fans registrados (base de datos y formulario Únete).
 * @returns Sección de interfaz.
 */
export function FansCard() {
  const { hasFans, fansTotalCount, uneteFansCount, fans } = useMetrics();
  return (
    <>
      {/* Fans Registrados (BBDD / Formulario Únete) Card */}
      {hasFans && (
        <div
          className={`p-4 rounded-[var(--r-m)] flex flex-col justify-between space-y-3 ${"bg-[var(--accent-alt)]/10"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-sans text-[var(--acc)] font-bold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[var(--acc)] fill-[var(--acc)]/20" />{" "}
              Fans Registrados
            </span>
            <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--ink)]">
              100% RGPD
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-display tracking-tight text-[var(--acc)]">
              {fansTotalCount.toLocaleString()}
            </div>
            <div className="text-micro font-sans text-[var(--ink-2)] mt-0.5">
              Contactos en base de datos
            </div>
          </div>
          <div className="pt-2  flex justify-between text-micro font-sans text-[var(--ink-2)]">
            <span>
              Formulario Únete:{" "}
              <b className="text-[var(--acc)]/70">{uneteFansCount}</b>
            </span>
            <span>
              Ciudades:{" "}
              <b className="text-[var(--ink)]">
                {new Set(fans.map((f) => f.ciudad).filter(Boolean)).size}
              </b>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
