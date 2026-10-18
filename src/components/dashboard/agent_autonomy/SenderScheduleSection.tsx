/**
 * Días y horas permitidos para el Agente Enviador.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar, Clock, Send } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { DAYS_OF_WEEK, HOURS } from "./autonomyTypes";

/**
 * Días y horas permitidos para el Agente Enviador.
 * @returns Sección de interfaz.
 */
export function SenderScheduleSection() {
  const { diasEnviador, horasEnviador, isAdmin, setDiasEnviador, toggleDiaEnviador, setHorasEnviador, toggleHoraEnviador } = useAgentAutonomy();
  return (
    <>
      {/* DÍAS Y HORAS ENVIADOR */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-4">
        {/* Header Enviador */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[var(--acc)]" />
            <div>
              <h4 className="text-xs font-sans font-bold text-[var(--ink)]">
                Agente enviador (días y horas de envío de pitches)
              </h4>
              <p className="text-micro text-[var(--ink-2)]">
                Días y horas permitidas para despachar correos
                aprobados a salas de conciertos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--ink)] font-bold">
              {diasEnviador.length} días · {horasEnviador.length}{" "}
              horas
            </span>
          </div>
        </div>

        {/* Días de la semana Selector (Enviador) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)]">
            <span className="font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
              Días de la Semana Habilitados:
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-micro">
                <button
                  type="button"
                  onClick={() => setDiasEnviador([2, 3, 4])}
                  className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] transition-ui cursor-pointer font-bold"
                >
                  <ShowIcon inline emoji="🔥" />Solo Top (M, X, J)
                </button>
                <button
                  type="button"
                  onClick={() => setDiasEnviador([1, 2, 3, 4, 5])}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui cursor-pointer"
                >
                  L-V
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDiasEnviador([1, 2, 3, 4, 5, 6, 7])
                  }
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui cursor-pointer"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setDiasEnviador([])}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = diasEnviador.includes(day.id);
              return (
                <button
                  key={`dia-enviador-${day.id}`}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => toggleDiaEnviador(day.id)}
                  className={`p-2.5 rounded-[var(--r-m)] text-left flex flex-col justify-between gap-1 transition-ui ${
                    !isAdmin
                      ? "cursor-default"
                      : "cursor-pointer active:scale-[0.97]"
                  } ${
                    isSelected
                      ? "bg-[var(--acc)]/15 text-[var(--ink)] ring-1 ring-[var(--acc)]/30"
                      : "bg-[var(--surface)]/90 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-sans font-bold ${isSelected ? "text-[var(--acc)]/70" : "text-[var(--ink-2)]"}`}
                    >
                      {day.short}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-[var(--r-pill)] ${isSelected ? "bg-[var(--acc)]" : "bg-[var(--surface)]/70"}`}
                    />
                  </div>
                  <span className="text-xs font-sans font-medium leading-tight truncate">
                    {day.name}
                  </span>
                  {day.recommended && (
                    <span className="text-micro font-sans px-1 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-bold self-start mt-0.5">
                      {day.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horas Enviador Grid */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-2)]">
            <span className="font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
              Horas del Día Habilitadas:
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-micro">
                <button
                  type="button"
                  onClick={() => setHorasEnviador([10, 11, 12, 13])}
                  className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--ink)] transition-ui cursor-pointer font-bold"
                >
                  <ShowIcon inline emoji="🔥" />Mañana (10-14h)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHorasEnviador([
                      9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                    ])
                  }
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui cursor-pointer"
                >
                  Jornada completa
                </button>
                <button
                  type="button"
                  onClick={() => setHorasEnviador([])}
                  className="px-2 py-0.5 rounded bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] transition-ui cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
            {HOURS.map((hour) => {
              const isSelected = horasEnviador.includes(hour);
              const isPrimeTime = hour >= 10 && hour <= 13;
              const formatted = `${String(hour).padStart(2, "0")}:00`;
              return (
                <button
                  key={`enviador-${hour}`}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => toggleHoraEnviador(hour)}
                  className={`p-2 rounded-[var(--r-pill)] text-center font-sans text-xs font-bold transition-ui ${
                    !isAdmin
                      ? "cursor-default"
                      : "cursor-pointer active:scale-[0.97]"
                  } ${
                    isSelected
                      ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                      : isPrimeTime
                        ? "bg-[var(--surface)] text-[var(--acc)]/70 hover:text-[var(--ink)] hover:bg-[var(--surface)]/80"
                        : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80"
                  }`}
                >
                  {formatted}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
