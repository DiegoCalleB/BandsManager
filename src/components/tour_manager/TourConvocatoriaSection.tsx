/**
 * Convocatoria de la gira: banda completa o parcial.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare,Sparkles,Users } from "lucide-react";
import { Button,Input,LinkButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useTourManager } from "./TourManagerContext";

/**
 * Convocatoria de la gira: banda completa o parcial.
 * @returns Sección de interfaz.
 */
export function TourConvocatoriaSection() {
  const { formConvocatoriaTipo, setFormConvocatoriaTipo, setFormConvocadosIds, availableMembers, handleSelectAllMembers, formConvocadosIds, handleToggleMember, dietaPerPersona, setDietaPerPersona, handleAutoCalculateDietas } = useTourManager();
  return (
    <>
<div className="sm:col-span-3 p-4 rounded-[var(--r-m)] bg-[var(--acc-soft)] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2/20 pb-3">
                        <div>
                          <span className="text-xs font-sans font-bold text-[var(--acc-ink)] flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[var(--acc-ink)]" />{" "}
                            Miembros y formación de la gira
                          </span>
                          <p className="text-xs text-[var(--ink-2)] mt-0.5">
                            Selecciona si viaja toda la banda o una formación
                            reducida/acústica. Afecta al cálculo de dietas,
                            hoteles y visibilidad en el calendario de cada
                            músico.
                          </p>
                        </div>

                        {/* Selector Banda Completa vs Parcial */}
                        <div className="flex rounded-[var(--r-s)] bg-[var(--sunken)] p-1">
                          <Button
                            variant={formConvocatoriaTipo === "completa" ? "selected" : "ghost"}
                            size="xs"
                            type="button"
                            onClick={() => {
                              setFormConvocatoriaTipo("completa");
                              setFormConvocadosIds(
                                availableMembers.map((m) => m.id),
                              );
                            }}
                          >
                            <ShowIcon inline emoji="👥" />Banda Completa ({availableMembers.length})
                          </Button>
                          <Button
                            variant={formConvocatoriaTipo === "parcial" ? "selected" : "ghost"}
                            size="xs"
                            type="button"
                            onClick={() => setFormConvocatoriaTipo("parcial")}
                          >
                            <ShowIcon inline emoji="👤" />Formación parcial / reducida
                          </Button>
                        </div>
                      </div>

                      {/* Lista de Miembros para Convocatoria */}
                      {formConvocatoriaTipo === "parcial" && (
                        <div className="space-y-2.5 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center text-xs text-[var(--ink-2)] font-sans">
                            <span>
                              Marca los músicos o miembros del equipo que
                              viajarán en esta gira:
                            </span>
                            <div className="flex gap-2">
                              <LinkButton
                                type="button"
                                onClick={handleSelectAllMembers}
                              >
                                Seleccionar todos
                              </LinkButton>
                              <span>|</span>
                              <LinkButton
                                tone="muted"
                                type="button"
                                onClick={() => setFormConvocadosIds([])}
                              >
                                Limpiar
                              </LinkButton>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {availableMembers.map((m) => {
                              const isSelected = formConvocadosIds.includes(
                                m.id,
                              );
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleToggleMember(m.id)}
                                  className={`p-2.5 rounded-[var(--r-m)] text-left flex items-center gap-3 transition-ui cursor-pointer ${
                                    isSelected
                                      ? "bg-[var(--acc)]/20 text-[var(--ink)]"
                                      : "bg-[var(--sunken)] text-[var(--ink-2)] "
                                  } hover:brightness-95`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "bg-[var(--ink)] text-[var(--bg)]"
                                        : ""
                                    }`}
                                  >
                                    {isSelected && (
                                      <CheckSquare className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate text-[var(--ink)]">
                                      {m.name}
                                    </div>
                                    <div className="text-micro text-[var(--ink-2)] truncate">
                                      {m.instrument || m.role}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Barra de Dietas por Músico */}
                      <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--acc-ink)] font-sans font-bold">
                            Expedición:{" "}
                            {formConvocatoriaTipo === "completa"
                              ? availableMembers.length
                              : formConvocadosIds.length}{" "}
                            personas convocadas
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[var(--ink-2)] font-sans text-xs">
                            Dieta / pers. / día:
                          </span>
                          <Input
                            size="sm"
                            type="number"
                            min="0"
                            value={dietaPerPersona}
                            onChange={(e) =>
                              setDietaPerPersona(Number(e.target.value))
                            }
                            className="w-16 text-center"
                          />
                          <span className="text-[var(--ink-2)] text-xs font-sans">
                            €
                          </span>
                          <button
                            type="button"
                            onClick={handleAutoCalculateDietas}
                            className="px-2.5 py-1 rounded bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)]/90 text-xs font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Aplica la dieta total (personas x dieta) a todas las paradas de la ruta"
                          >
                            <Sparkles className="w-3 h-3" /> Aplicar a paradas
                          </button>
                        </div>
                      </div>
                    </div>
    </>
  );
}
