/**
 * Nota de que el Agente Lector corre en todos los ticks.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Mail } from "lucide-react";

/**
 * Nota de que el Agente Lector corre en todos los ticks.
 * @returns Sección de interfaz.
 */
export function ReaderAgentNote() {
  return (
    <>
      {/* Agente Lector: ya no tiene horario configurable - corre en TODOS los ticks del
 scheduler (cada ~60s), porque a diferencia del Enviador (que sí debe respetar
 una ventana comercial para no escribir de madrugada) leer la bandeja y detectar
 respuestas/borradores enviados no tiene ninguna razón para esperar. */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--ink-2)]" />
          <h4 className="text-xs font-sans font-bold text-[var(--ink)]">
            Agente lector (bandeja de entrada)
          </h4>
          <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--ok)]/10 text-[var(--ink-2)] font-bold">
            Siempre activo
          </span>
        </div>
        <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
          Revisa tu bandeja constantemente (cada minuto), sin horario
          configurable: detecta respuestas de las salas y actualiza el
          hilo del lead, y comprueba si algún borrador de Gmail se ha
          enviado a mano para marcar el lead como contactado. Las
          horas y días de abajo son solo para el Agente Enviador (el
          despacho de propuestas).
        </p>
      </div>
    </>
  );
}
