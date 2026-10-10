/**
 * Tarjeta con los mejores días según la inteligencia de IA.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../../ui/ShowIcon";

/**
 * Tarjeta con los mejores días según la inteligencia de IA.
 * @returns Sección de interfaz.
 */
export function BestDaysCard() {
  return (
    <>
      {/* AI Best Days Intelligence Card */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/5 text-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-[var(--acc)]">
            <span>
              Inteligencia de Booking: ¿Por qué Martes, Miércoles y
              Jueves?
            </span>
          </div>
          <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--ink)] font-bold">
            +45% Tasa de respuesta
          </span>
        </div>
        <p className="leading-relaxed text-[var(--ink-2)] text-xs">
          En la industria del directo, los programadores de salas y
          festivales dedican el{" "}
          <strong>martes a jueves (10:00 - 14:00)</strong> a cerrar
          contrataciones. Los lunes gestionan incidencias del fin de
          semana y los viernes/sábados están en montaje de conciertos
          en vivo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans text-micro">
          <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
            <span className="text-[var(--acc)] font-bold">
              <ShowIcon inline emoji="🔥" />Martes a Jueves
            </span>
            <span className="text-[var(--ink-2)] font-sans text-micro">
              Ventana dorada de contratación y respuesta.
            </span>
          </div>
          <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
            <span className="text-[var(--ink-2)] font-bold">
              <ShowIcon inline emoji="⏰" />10:00 a 14:00
            </span>
            <span className="text-[var(--ink-2)] font-sans text-micro">
              Franja de máxima apertura y lectura de email.
            </span>
          </div>
          <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] flex flex-col gap-0.5">
            <span className="text-[var(--ok)] font-bold">
              <ShowIcon inline emoji="🛡️" />Smart Gate Supabase
            </span>
            <span className="text-[var(--ink-2)] font-sans text-micro">
              Los agentes solo envían en los días/horas elegidos.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
