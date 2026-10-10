/**
 * Selector de zona horaria de los agentes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Globe } from "lucide-react";
import { Select } from "../../ui";
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { TIMEZONES } from "./autonomyTypes";

/**
 * Selector de zona horaria de los agentes.
 * @returns Sección de interfaz.
 */
export function TimezoneSelector() {
  const { isAdmin, timezone, setTimezone } = useAgentAutonomy();
  return (
    <>
      {/* Timezone Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-sans text-[var(--ink-2)] font-semibold flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[var(--acc)]" /> Zona horaria
          de la banda
        </label>
        <Select size="sm" aria-label="Zona horaria de la banda"
          disabled={!isAdmin}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          wrapperClassName="w-full"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
