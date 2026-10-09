/**
 * Pestaña de bitácora de contacto del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { History, Save, Trash2 } from "lucide-react";
import { Input, Textarea, IconButton } from "../../ui";
import { PublicoSilhouette } from "../../ui/PublicoSilhouette";
import { Lead } from "../../../types";
import React, { FormEvent, Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueBitacoraSectionProps {
  activeTab: "info" | "emails" | "intelligence" | "copilot" | "bitacora";
  selectedLead: Lead;
  handleAddInteractionLog: (e: FormEvent<Element>) => void;
  setInteractionType: Dispatch<SetStateAction<"Llamada" | "WhatsApp" | "Email" | "Reunión" | "Otro">>;
  interactionType: "Llamada" | "WhatsApp" | "Email" | "Reunión" | "Otro";
  interactionAutor: string;
  setInteractionAutor: Dispatch<SetStateAction<string>>;
  setInteractionResultado: Dispatch<SetStateAction<"Interesado" | "Enviar propuesta" | "Seguimiento pendiente" | "Rechazado" | "Info recibida" | "Acuerdo cerrado">>;
  interactionResultado: "Interesado" | "Enviar propuesta" | "Seguimiento pendiente" | "Rechazado" | "Info recibida" | "Acuerdo cerrado";
  interactionNotes: string;
  setInteractionNotes: Dispatch<SetStateAction<string>>;
  handleDeleteInteractionLog: (logId: string) => void;
}

/**
 * Pestaña de bitácora de contacto del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueBitacoraSectionProps}).
 * @returns Sección de interfaz.
 */
export function VenueBitacoraSection({ activeTab, selectedLead, handleAddInteractionLog, setInteractionType, interactionType, interactionAutor, setInteractionAutor, setInteractionResultado, interactionResultado, interactionNotes, setInteractionNotes, handleDeleteInteractionLog }: VenueBitacoraSectionProps) {
  return (
    <>
{/* TAB 4: CONTACT BITÁCORA */}
      {activeTab === "bitacora" && (
        <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--acc)]" />
              <h4 className="text-xs font-bold text-[var(--ink)] font-sans">
                Bitácora de contacto y llamadas
              </h4>
            </div>
            <span className="text-micro text-[var(--acc)]/80 font-sans">
              {(selectedLead.historial_contacto || []).length} registros
            </span>
          </div>

          {/* Log Form */}
          <form
            onSubmit={handleAddInteractionLog}
            className="space-y-3 bg-[var(--surface)] p-3 rounded-[var(--r-m)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Interaction Type Selector */}
              <div className="flex items-center gap-1 bg-[var(--sunken)] p-1 rounded-[var(--r-s)]">
                {(
                  ["Llamada", "WhatsApp", "Email", "Reunión", "Otro"] as const
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInteractionType(type)}
                    className={`px-2 py-1 rounded text-micro font-bold transition-ui cursor-pointer ${
                      interactionType === type
                        ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {type === "Llamada"
                      ? "📞"
                      : type === "WhatsApp"
                        ? "💬"
                        : type === "Email"
                          ? "✉️"
                          : type === "Reunión"
                            ? "🤝"
                            : "📝"}
                    {" "}
                    {type}
                  </button>
                ))}
              </div>

              {/* Author input */}
              <Input
                size="sm"
                type="text"
                value={interactionAutor}
                onChange={(e) => setInteractionAutor(e.target.value)}
                placeholder="Tu nombre…"
                className="w-28"
              />
            </div>

            {/* Result Outcome Pills */}
            <div className="space-y-1">
              <span className="text-micro text-[var(--ink-2)] font-sans">
                Resultado del contacto:
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    "Interesado",
                    "Enviar propuesta",
                    "Seguimiento pendiente",
                    "Acuerdo cerrado",
                    "Rechazado",
                    "Info recibida",
                  ] as const
                ).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setInteractionResultado(res)}
                    className={`px-2 py-0.5 rounded text-micro font-medium transition-ui cursor-pointer ${
                      interactionResultado === res
                        ? res === "Interesado" || res === "Acuerdo cerrado"
                          ? "bg-[var(--ok)]/30 text-[var(--ink)] font-bold"
                          : res === "Rechazado"
                            ? "bg-[var(--alert)]/30 text-[var(--ink)] font-bold"
                            : "bg-[var(--acc)]/30 text-[var(--ink)] font-bold"
                        : "bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes textarea */}
            <Textarea
              rows={4}
              required
              value={interactionNotes}
              onChange={(e) => setInteractionNotes(e.target.value)}
              placeholder="Ej: Hablé con Carlos por WhatsApp. Pide propuesta de fechas para Noviembre…"
              className="w-full min-h-[90px]"
            />

            <button
              type="submit"
              className="w-full py-2 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs rounded-[var(--r-s)] transition-ui cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Anotar en Bitácora</span>
            </button>
          </form>

          {/* Timeline Feed */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {(selectedLead.historial_contacto || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <PublicoSilhouette opacity={0.12} size="small" />
                <p className="mt-3 font-medium text-[var(--ink)] text-xs">
                  Sin interacciones
                </p>
                <p className="mt-1.5 text-[var(--ink-2)] text-micro max-w-xs text-center">
                  Registra llamadas y mensajes desde la entrada de contacto.
                </p>
              </div>
            ) : (
              (selectedLead.historial_contacto || []).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-[var(--r-s)] bg-[var(--bg)] space-y-1.5 text-xs font-sans relative group"
                >
                  <div className="flex items-center justify-between text-micro">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--acc-ink)]">
                        {log.tipo === "Llamada"
                          ? "Llamada"
                          : log.tipo === "WhatsApp"
                            ? "WhatsApp"
                            : log.tipo === "Email"
                              ? "Email"
                              : log.tipo === "Reunión"
                                ? "Reunión"
                                : "Nota"}
                      </span>
                      <span className="text-[var(--ink-2)]">
                        {log.autor || "Agente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ink-2)] font-sans">
                        {log.fecha}
                      </span>
                      <IconButton
                        label="Borrar entrada"
                        variant="danger"
                        size="icon-xs"
                        type="button"
                        onClick={() => handleDeleteInteractionLog(log.id)}
                        className="opacity-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </IconButton>
                    </div>
                  </div>

                  {log.resultado && (
                    <div>
                      <span
                        className={`inline-block text-micro px-1.5 py-0.2 rounded font-bold ${
                          log.resultado === "Interesado" ||
                          log.resultado === "Acuerdo cerrado"
                            ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                            : log.resultado === "Rechazado"
                              ? "bg-[var(--alert)]/20 text-[var(--ink)]"
                              : "bg-[var(--acc)]/20 text-[var(--ink)]"
                        }`}
                      >
                        {log.resultado}
                      </span>
                    </div>
                  )}

                  <p className="text-[var(--ink)] text-xs leading-snug whitespace-pre-wrap select-text">
                    {log.notas}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
