/**
 * Preferencia por el diseño Espectro (en pruebas).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check } from "lucide-react";
import { PREFERENCIAS as PREFERENCIAS_ESPECTRO,guardarPreferencia as guardarPreferenciaEspectro,resolverTema as resolverTemaEspectro } from "../../utils/temaEspectro";
import { useUserProfile } from "./UserProfileContext";

/**
 * Preferencia por el diseño Espectro (en pruebas).
 * @returns Sección de interfaz.
 */
export function EspectroPreferenceCard() {
  const { prefEspectro, setPrefEspectro } = useUserProfile();
  return (
    <>
      <div className="pt-3 ">
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/[0.04] space-y-2.5">
          <label className="text-xs font-sans font-semibold text-[var(--acc)]/70 flex items-center gap-1.5">
            <span>Nuevo diseño — Espectro (en pruebas)</span>
          </label>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Ve probando el rediseño mientras migro pantalla a pantalla. Lo
            que aún no está migrado se ve igual que siempre en cualquiera
            de las cuatro opciones — no rompe nada.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PREFERENCIAS_ESPECTRO.map((p) => {
              const isSelected = prefEspectro === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPrefEspectro(p.id);
                    guardarPreferenciaEspectro(p.id);
                  }}
                  className={`p-2 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[var(--acc)]/15  text-[var(--ink)] font-bold"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                  }`}
                  title={p.descripcion}
                >
                  <span className="text-xs font-sans truncate">
                    {p.etiqueta}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-micro text-[var(--ink-2)] font-sans">
            Ahora mismo:{" "}
            {resolverTemaEspectro(prefEspectro) === "dark"
              ? "oscuro"
              : resolverTemaEspectro(prefEspectro) === "light"
                ? "claro"
                : "clásico"}
          </p>
        </div>
      </div>

      {/* Agent Configuration Entry Point (Autonomía, Horarios & Email) - un único modal
 centralizado (AgentAutonomySettingsModal, el mismo que usan Dashboard/Chatbot/BookingCRM)
 en vez de duplicar aquí el formulario de horarios (antes BandScheduleConfig, ahora
 eliminado) y de email. EmailAccountConfig sigue siendo el mismo componente compartido,
 solo que ahora se llega a él siempre por el mismo camino. */}
    </>
  );
}
