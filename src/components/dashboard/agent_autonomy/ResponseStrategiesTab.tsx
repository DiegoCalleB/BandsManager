/**
 * Pestaña de estrategias de respuesta del Contestador por tipo de mensaje.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Brain, Loader2, MessageSquare, Save } from "lucide-react";
import { Button, Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useAgentAutonomy } from "./AgentAutonomyContext";
import { RESPONSE_LEARNED_CATEGORY_LABELS } from "./autonomyTypes";
import { RESPONSE_TYPES, ResponseTone } from "./responseTypes";

/**
 * Pestaña de estrategias de respuesta del Contestador por tipo de mensaje.
 * @returns Sección de interfaz.
 */
export function ResponseStrategiesTab() {
  const { activeTab, learnedResponseRules, onOpenTemplatesSection, onClose, getStrategyOrDefault, isAdmin, updateStrategyField, strategiesFeedback, handleSaveResponseStrategies, isSavingStrategies } = useAgentAutonomy();
  return (
    <>
      {/* TAB 2: ESTRATEGIAS DE RESPUESTA (guía condicional del Contestador según el tipo
 de mensaje que la sala responda - ver server/services/replyDrafting.ts) */}
      {activeTab === "response_strategies" && (
      <div className="space-y-6">
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--tentative)] text-xs flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[var(--tentative)] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="font-bold text-[var(--tentative)]">
              ¿Cómo debe responder el agente cuando una sala contesta?
            </strong>
            <p className="text-[var(--ink-2)] text-xs">
              Cuando una sala responde a un correo, el Agente Lector
              detecta automáticamente de qué tipo de mensaje se trata y
              redacta un borrador. Aquí puedes darle instrucciones
              concretas para cada tipo de situación, además del tono a
              aplicar. El borrador siempre queda pendiente de tu
              aprobación antes de enviarse.
            </p>
          </div>
        </div>

        {/* Reglas aprendidas automáticamente de tus correcciones reales (Self-Refining
 Tone DNA), mostradas AQUÍ MISMO junto a la configuración manual de abajo para
 que sea fácil pillar si se contradicen: la config manual está organizada por
 TIPO de respuesta (negociación, confirmación...), esto por TIPO de sala (salas,
 festivales...) - no hay un cruce automático entre ambas, así que la detección
 de conflicto depende de que lo veas tú al leerlas juntas. */}
        {Object.keys(learnedResponseRules).length > 0 && (
          <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 space-y-2.5">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-[var(--ink-2)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--tentative)] block">
                  Lo que el sistema ya ha aprendido solo de tus
                  respuestas reales
                </span>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Compara esto con lo que configures abajo: si se
                  contradicen (p. ej. aquí dice"sé breve" pero abajo
                  pides explicar mucho), la guía manual de abajo tiene
                  prioridad, pero mejor evitar la contradicción desde el
                  principio. Si una regla concreta no encaja, puedes
                  quitarla desde{" "}
                  <strong className="text-[var(--tentative)]">
                    ADN de tono → reglas aprendidas de tus respuestas
                  </strong>{" "}
                  (ahí también se pueden borrar o añadir a mano).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {Object.entries(learnedResponseRules).map(
                ([cat, reglas]) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] space-y-1"
                  >
                    <span className="text-micro font-sans font-bold text-[var(--ink-2)]">
                      {RESPONSE_LEARNED_CATEGORY_LABELS[cat] || cat}
                    </span>
                    {reglas.reglas_manuales &&
                      reglas.reglas_manuales.length > 0 && (
                        <ul className="space-y-0.5">
                          {reglas.reglas_manuales.map((r, idx) => (
                            <li
                              key={idx}
                              className="text-micro font-sans text-[var(--ink)]"
                            >
                              <ShowIcon inline emoji="🔒" />{r}
                            </li>
                          ))}
                        </ul>
                      )}
                    {reglas.reglas_estilo_aprendidas &&
                    reglas.reglas_estilo_aprendidas.length > 0 ? (
                      <ul className="space-y-0.5">
                        {reglas.reglas_estilo_aprendidas.map(
                          (r, idx) => (
                            <li
                              key={idx}
                              className="text-micro font-sans text-[var(--ink-2)]"
                            >
                              <ShowIcon inline emoji="⭐" />{r}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      (!reglas.reglas_manuales ||
                        reglas.reglas_manuales.length === 0) && (
                        <p className="text-micro font-sans text-[var(--ink-2)]">
                          Sin reglas todavía.
                        </p>
                      )
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Atajo hacia Hilos de Email de Ejemplo (ExampleThreadsSection, dentro de Booking
 CRM > Plantillas de Email > por categoría): es la forma más rápida de arrancar
 con calidad desde el día 1 - a diferencia de las reglas de arriba (que necesitan
 2+ correcciones reales acumuladas para generarse solas), pegar 2-3 conversaciones
 reales ya buenas alimenta el few-shot de pitches Y respuestas al instante. Sin
 este aviso, esta herramienta es fácil de no descubrir nunca (vive dentro de una
 sub-pestaña de una sub-pestaña de otra pantalla). Reutiliza el mismo callback
 onOpenTemplatesSection que ya usan la pestaña Autonomía y Tono para lo mismo. */}
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-sans font-bold text-[var(--ink-2)]">
              ¿Quieres que aprenda rápido, sin esperar a corregir
              borradores?
            </h4>
            <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
              Pega 2-3 conversaciones reales (vuestro mensaje + la
              respuesta de la sala) en Hilos de Email de Ejemplo.
              Alimentan al instante tanto el pitch inicial como las
              respuestas, sin esperar a acumular correcciones.
            </p>
          </div>
          {onOpenTemplatesSection ? (
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={() => {
                onClose();
                onOpenTemplatesSection();
              }}
              className="shrink-0"
            >
              Ver hilos de ejemplo ➔
            </Button>
          ) : (
            <span className="text-micro text-[var(--ink-2)] font-sans shrink-0 max-w-[160px] text-right">
              Búscalo en plantillas de email
            </span>
          )}
        </div>

        {RESPONSE_TYPES.map((type) => {
          const strategy = getStrategyOrDefault(type.key);
          return (
            <div
              key={type.key}
              className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--tentative)]/10 text-[var(--tentative)]">
                  <ShowIcon inline emoji={type.icon} />
                </span>
                <div>
                  <h4 className="text-xs font-sans font-bold text-[var(--ink)]">
                    {type.label}
                  </h4>
                  <p className="text-micro text-[var(--ink-2)] font-sans">
                    {type.description}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
                  Instrucción para la IA (opcional)
                </label>
                <Textarea
                  disabled={!isAdmin}
                  rows={2}
                  value={strategy.guidancePrompt}
                  onChange={(e) =>
                    updateStrategyField(
                      type.key,
                      "guidancePrompt",
                      e.target.value,
                    )
                  }
                  placeholder={`Ej: ${
                    type.key === "price_negotiation"
                      ? "Menciona que somos flexibles con taquilla compartida, pero no des cifras concretas por email."
                      : type.key === "confirmation"
                        ? "Pide directamente los datos técnicos del rider y el horario de la prueba de sonido."
                        : type.key === "rejection"
                          ? "Pregunta si hay otras fechas disponibles más adelante en la temporada."
                          : "Responde de forma breve y concreta a lo que pregunten, sin extenderte."
                  }`}
                  className="w-full"
                />
                <p className="text-micro text-[var(--ink-2)]">
                  Si lo dejas vacío, el agente usa una guía automática
                  genérica para este tipo de respuesta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <div className="space-y-1 flex-1">
                  <label className="text-micro font-sans text-[var(--ink-2)] font-semibold block">
                    Tono
                  </label>
                  <div className="flex gap-1.5">
                    {(
                      [
                        "neutral",
                        "enthusiastic",
                        "cautious",
                      ] as ResponseTone[]
                    ).map((toneOption) => (
                      <button
                        key={toneOption}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() =>
                          updateStrategyField(
                            type.key,
                            "tone",
                            toneOption,
                          )
                        }
                        className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui ${
                          !isAdmin ? "cursor-default" : "cursor-pointer"
                        } ${
                          strategy.tone === toneOption
                            ? "bg-[var(--tentative)]/20 text-[var(--tentative)]"
                            : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {toneOption === "neutral"
                          ? "Neutral"
                          : toneOption === "enthusiastic"
                            ? "Entusiasta"
                            : "Prudente"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)] font-sans text-xs">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={strategy.mentionLinks}
                    onChange={(e) =>
                      updateStrategyField(
                        type.key,
                        "mentionLinks",
                        e.target.checked,
                      )
                    }
                    className="rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-[var(--acc)] disabled:opacity-60"
                  />
                  <span>
                    Mencionar enlace al Dossier/EPK si procede
                  </span>
                </label>
              </div>
            </div>
          );
        })}

        {isAdmin && (
          <div className="flex items-center justify-between gap-3 pt-1">
            {strategiesFeedback && (
              <span className="text-xs font-sans text-[var(--ink-2)]">
                {strategiesFeedback}
              </span>
            )}
            <button data-raw
              type="button"
              onClick={handleSaveResponseStrategies}
              disabled={isSavingStrategies}
              className="ml-auto px-4 py-2 rounded-[var(--r-pill)] bg-[var(--tentative)] hover:bg-[var(--acc)] text-[var(--on-tentative)] font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-ui"
            >
              {isSavingStrategies ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {isSavingStrategies
                  ? "Guardando..."
                  : "Guardar Estrategias de Respuesta"}
              </span>
            </button>
          </div>
        )}
      </div>
      )}
    </>
  );
}
