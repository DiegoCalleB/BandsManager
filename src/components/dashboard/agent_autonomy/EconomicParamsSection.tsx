/**
 * Parámetros económicos: caché mínimo, márgenes y condiciones de negociación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Euro } from "lucide-react";
import { Input } from "../../ui";
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { RESPONSE_LEARNED_CATEGORY_LABELS } from "./autonomyTypes";

/**
 * Parámetros económicos: caché mínimo, márgenes y condiciones de negociación.
 * @returns Sección de interfaz.
 */
export function EconomicParamsSection() {
  const { bandName, isAdmin, config, setConfig } = useAgentAutonomy();
  return (
    <>
      {/* 3. PARÁMETROS ECONÓMICOS */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-4">
        <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
          <Euro className="w-4 h-4" /> 3. Caché Mínimo por Tipo de
          Recinto para {bandName}
        </h4>

        <p className="text-xs text-[var(--ink-2)]">
          Define el caché mínimo aceptable para cada tipo de recinto.
          Dejar un campo vacío significa que ese tipo no aplica a tus
          negociaciones.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(
            [
              "salas",
              "festivales",
              "discotecas",
              "ayuntamientos",
              "medios",
              "grupos",
            ] as const
          ).map((type) => (
            <div key={type} className="space-y-1.5">
              <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
                {RESPONSE_LEARNED_CATEGORY_LABELS[type]}
              </label>
              <div className="relative">
                <Input
                  size="sm"
                  type="number"
                  disabled={!isAdmin}
                  value={config.minCacheByType?.[type] || ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? Number(e.target.value)
                      : undefined;
                    setConfig({
                      ...config,
                      minCacheByType: {
                        ...config.minCacheByType,
                        [type]: val,
                      },
                    });
                  }}
                  className="w-full"
                  placeholder="—"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[var(--ink-2)] font-sans">
                  €
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 space-y-2">
          <h5 className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5" /> Caché de inicio de
            negociación (opcional)
          </h5>
          <p className="text-xs text-[var(--ink-2)]">
            Si la sala pregunta directamente por el caché, el agente
            responderá con esta cifra en vez del mínimo real, dejando
            margen para negociar a la baja sin bajar nunca del mínimo.
            Déjalo vacío para que el agente no mencione cifras salvo
            que le pregunten.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                "salas",
                "festivales",
                "discotecas",
                "ayuntamientos",
                "medios",
                "grupos",
              ] as const
            ).map((type) => {
              const minVal = config.minCacheByType?.[type];
              const negStartVal =
                config.negotiationStartCacheByType?.[type];
              const isBelowMin =
                typeof minVal === "number" &&
                typeof negStartVal === "number" &&
                negStartVal < minVal;
              return (
                <div key={type} className="space-y-1.5">
                  <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
                    {RESPONSE_LEARNED_CATEGORY_LABELS[type]}
                  </label>
                  <div className="relative">
                    <Input
                      size="sm"
                      type="number"
                      disabled={!isAdmin}
                      value={negStartVal || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? Number(e.target.value)
                          : undefined;
                        setConfig({
                          ...config,
                          negotiationStartCacheByType: {
                            ...config.negotiationStartCacheByType,
                            [type]: val,
                          },
                        });
                      }}
                      className="w-full"
                      placeholder="—"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-[var(--ink-2)] font-sans">
                      €
                    </span>
                  </div>
                  {isBelowMin && (
                    <p className="text-micro text-[var(--alert)] font-sans">
                      Por debajo del mínimo real (€{minVal})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.autoDeclineUnderMinCache}
              onChange={(e) =>
                setConfig({
                  ...config,
                  autoDeclineUnderMinCache: e.target.checked,
                })
              }
              className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-[var(--acc)] disabled:opacity-60"
            />
            <span>
              Rechazar amablemente si no se alcanza el caché mínimo
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.notifyOnEveryProposal}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notifyOnEveryProposal: e.target.checked,
                })
              }
              className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-[var(--acc)] disabled:opacity-60"
            />
            <span>
              Notificar en el panel cada vez que se prepare un nuevo
              correo
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
