/**
 * Diálogo asistente para nombrar temas y discursos del concierto (tabla rápida y pegado por lote).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, FileText, Sliders, Tag, X } from "lucide-react";
import { Button, IconButton, Input, Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { formatSeconds } from "./timeFormat";

/**
 * Diálogo asistente para nombrar temas y discursos del concierto (tabla rápida y pegado por lote).
 * @returns Sección de interfaz.
 */
export function QuickNamingDialog() {
  const { showQuickNamingModal, tracks, setShowQuickNamingModal, setQuickNamingActiveTab, quickNamingActiveTab, handleUpdateTrack, batchPastedText, setBatchPastedText, handleApplyBatchPastedNames } = useLiveConcertAlbum();
  return (
    <>
      {showQuickNamingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-3xl w-full p-6 space-y-4 text-[var(--ink-2)] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--ink)]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink-2)] flex items-center gap-2">
                    <span>Nombrar temas y speeches</span>
                    <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
                      {tracks.length} cortes
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Personaliza el título de cada canción o presentación, o
                    pega tu lista/setlist completo en lote
                  </p>
                </div>
              </div>
              <IconButton
                label="Cerrar"
                size="icon-xs"
                onClick={() => setShowQuickNamingModal(false)}
              >
                <X className="w-5 h-5" />
              </IconButton>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuickNamingActiveTab("table")}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1.5 transition-ui ${
                  quickNamingActiveTab === "table"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Lista rápida editable</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickNamingActiveTab("paste")}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1.5 transition-ui ${
                  quickNamingActiveTab === "paste"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pegar Setlist / lista en bloque</span>
              </button>
            </div>

            {/* Tab 1: Quick Table */}
            {quickNamingActiveTab === "table" && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
                <div className="text-xs text-[var(--ink-2)] bg-[var(--surface)]/60 p-2.5 rounded-[var(--r-m)] flex items-center justify-between">
                  <span>
                    <ShowIcon inline emoji="💡" />Edita directamente el título de cada corte o cambia
                    su tipo entre <ShowIcon inline emoji="🎵" />Canción y <ShowIcon inline emoji="🗣️" />Speech. Pulsa Tab para
                    avanzar al siguiente.
                  </span>
                  <div className="flex items-center gap-2 text-micro font-sans shrink-0">
                    <span className="text-[var(--acc)]">
                      <ShowIcon inline emoji="🎵" />{tracks.filter((t) => t.type === "musica").length}{" "}
                      temas
                    </span>
                    <span className="text-[var(--tentative)]">
                      <ShowIcon inline emoji="🗣️" />{tracks.filter((t) => t.type === "dialogo").length}{" "}
                      speeches
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {tracks.map((tr) => (
                    <div
                      key={`quick-rename-${tr.index}`}
                      className={`p-2.5 rounded-[var(--r-m)] transition-ui flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                        tr.type === "musica"
                          ? "bg-[var(--acc-soft)]  "
                          : "bg-[var(--tentative)]/5 hover:brightness-95"
                      }`}
                    >
                      {/* Index + Type Toggle Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-7 text-center font-sans font-bold text-xs text-[var(--ink-2)] bg-[var(--surface)] px-1.5 py-1 rounded">
                          #{String(tr.index).padStart(2, "0")}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const newType =
                              tr.type === "musica" ? "dialogo" : "musica";
                            handleUpdateTrack(tr.index, "type", newType);
                            if (
                              newType === "dialogo" &&
                              (tr.title.startsWith("Tema ") ||
                                tr.title.startsWith("Pista "))
                            ) {
                              handleUpdateTrack(
                                tr.index,
                                "title",
                                `Presentación / Speech ${tr.index}`,
                              );
                            } else if (
                              newType === "musica" &&
                              (tr.title.startsWith("Presentación") ||
                                tr.title.startsWith("Speech"))
                            ) {
                              handleUpdateTrack(
                                tr.index,
                                "title",
                                `Tema ${tr.index}`,
                              );
                            }
                          }}
                          className={`px-2 py-1 rounded-[var(--r-pill)] text-xs font-bold transition-ui flex items-center gap-1 cursor-pointer ${
                            tr.type === "musica"
                              ? "bg-[var(--acc)]/20 text-[var(--ink)]  hover:bg-[var(--acc)]/30"
                              : "bg-[var(--tentative)]/20 text-[var(--tentative)] hover:bg-[var(--tentative)]/30"
                          }`}
                          title="Haz clic para alternar entre canción y speech"
                        >
                          {tr.type === "musica"
                            ? "Canción"
                            : "Speech"}
                        </button>

                        <span className="text-xs font-sans text-[var(--ink-2)]">
                          {formatSeconds(tr.duration)}
                        </span>
                      </div>

                      {/* Title Input */}
                      <div className="flex-1 min-w-0 relative">
                        <Input
                          size="sm"
                          type="text"
                          value={tr.title}
                          onChange={(e) =>
                            handleUpdateTrack(
                              tr.index,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder={
                            tr.type === "musica"
                              ? "Nombre del tema..."
                              : "Nombre de la presentación o speech..."
                          }
                          className="w-full"
                        />
                        {tr.title && (
                          <IconButton
                            label="Cerrar"
                            type="button"
                            onClick={() =>
                              handleUpdateTrack(tr.index, "title", "")
                            }
                            className="absolute right-2 top-1/2"
                          >
                            <X className="w-3 h-3" />
                          </IconButton>
                        )}
                      </div>

                      {/* Quick Presets Per Row */}
                      <div className="flex items-center gap-1 shrink-0">
                        {tr.type === "dialogo" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  "Presentación de la Banda",
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)] text-micro"
                            >
                              Banda
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  "Saludo al Público",
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)] text-micro"
                            >
                              Saludo
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  "Despedida / Bises",
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)] text-micro"
                            >
                              Despedida
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const base = tr.title.replace(
                                  /\s*\((?:Intro|Outro|Acústico)\)/gi,
                                  "",
                                );
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  `${base} (Intro)`,
                                );
                              }}
                              className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro"
                            >
                              +Intro
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const base = tr.title.replace(
                                  /\s*\((?:Intro|Outro|Acústico)\)/gi,
                                  "",
                                );
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  `${base} (Acústico)`,
                                );
                              }}
                              className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro"
                            >
                              +Acústico
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const base = tr.title.replace(
                                  /\s*\((?:Intro|Outro|Acústico)\)/gi,
                                  "",
                                );
                                handleUpdateTrack(
                                  tr.index,
                                  "title",
                                  `${base} (Outro)`,
                                );
                              }}
                              className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro"
                            >
                              +Outro
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Batch Paste */}
            {quickNamingActiveTab === "paste" && (
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink-2)] space-y-2">
                  <p className="font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                    Pega el Setlist o lista de canciones y speeches (una por
                    línea)
                  </p>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    Copia la lista desde tu WhatsApp, notas o papel de
                    escenario y pégala aquí. El asistente asignará cada
                    línea a la pista correspondiente (#1, #2, #3…) y
                    limpiará automáticamente números iniciales (“1.”, “01 -”,
                    etc.).
                  </p>
                  <p className="text-xs text-[var(--tentative)]/80">
                    <ShowIcon inline emoji="💡" />Si una línea contiene palabras como <em>“speech”</em>
                    , <em>“presentación”</em>, <em>“saludo”</em>,{" "}
                    <em>“charla”</em> o <em>“agradecimientos”</em>, la
                    clasificará automáticamente como Speech.
                  </p>
                </div>

                <Textarea
                  value={batchPastedText}
                  onChange={(e) => setBatchPastedText(e.target.value)}
                  rows={10}
                  placeholder={`1. Intro y Saludo al Público\n2. Noches de Garaje\n3. Charla sobre el nuevo disco\n4. Ska del Norte\n5. Canto a la Sombra\n6. Presentación de los músicos\n7. Gira Sin Fin`}
                  className="w-full"
                />

                <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                  <span>
                    Líneas detectadas:{" "}
                    <strong className="text-[var(--ink-2)]">
                      {
                        batchPastedText
                          .split("\n")
                          .filter((l) => l.trim().length > 0).length
                      }
                    </strong>
                    {" "}/ Cortes en concierto:{" "}
                    <strong className="text-[var(--acc)]">
                      {tracks.length}
                    </strong>
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleApplyBatchPastedNames}
                    disabled={!batchPastedText.trim()}
                    className="items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aplicar nombres a las pistas</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 flex justify-end shrink-0">
              <Button
                variant="neutral"
                size="sm"
                type="button"
                onClick={() => setShowQuickNamingModal(false)}
              >
                Listo / cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
