/**
 * Fecha y hora de programación del post.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Input } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Fecha y hora de programación del post.
 * @returns Sección de interfaz.
 */
export function SchedulerInputs() {
  const { scheduledDate, setScheduledDate, scheduledTime, setScheduledTime } = useReelsCenter();
  return (
    <>
      {/* Interactive Scheduler Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="block text-micro font-sans text-[var(--ink-2)]">
            Fecha de envío
          </span>
          <Input
            size="sm"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <span className="block text-micro font-sans text-[var(--ink-2)]">
            Hora sugerida
          </span>
          <Input
            size="sm"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
