/**
 * Burbuja de un mensaje del chat con su texto formateado, hora y acciones propuestas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle, Download, Guitar, PlayCircle, RefreshCw, Save, Sparkles, User } from "lucide-react";
import { MelodicInstrument } from "../../types";
import { Button, Select } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useChat } from "./ChatContext";
import { ChatMessage } from "./chatTypes";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface ChatMessageBubbleProps {
  msg: ChatMessage;
}

/**
 * Burbuja de un mensaje del chat con su texto formateado, hora y acciones propuestas.
 * @returns Sección de interfaz.
 */
export function ChatMessageBubble({ msg }: ChatMessageBubbleProps) {
  const { parseMarkdown, handleConfirmAllActions, accompanimentAudio, songPicker, setSongPicker, handleSaveAccompanimentToSong, handleGenerateAccompanimentAudio, melodicIdeaAudio, handleDownloadMelodicIdeaMidi, handleSaveMelodicIdeaToSong, handleGenerateMelodicIdeaAudio, handleConfirmAction, handleDismissAction } = useChat();
  const isBot = msg.sender === 'bot';
  return (
    <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}>
      {/* Avatar circle */}
      <div
        className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
          isBot ? 'bg-[var(--tentative)]/5 text-[var(--tentative)]' : 'bg-[var(--sunken)] text-[var(--ink-2)]'
        }`}
      >
        {isBot ? <Guitar className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      </div>

      <div className="space-y-2">
        {/* Text Bubble */}
        <div
          className={`p-3.5 rounded-[var(--r-m)] text-xs leading-relaxed ${
            isBot
              ? 'bg-[var(--surface)] text-[var(--ink)] rounded-tl-none'
              : 'bg-[var(--tentative)]/5 text-[var(--tentative)] rounded-tr-none'
          }`}
        >
          <div className="space-y-1">{parseMarkdown(msg.text)}</div>
          <span className="text-micro font-sans text-[var(--ink-2)] block mt-2 text-right">
            {msg.timestamp instanceof Date
              ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Proposed actions box within chat */}
        {isBot &&
          msg.proposedActions &&
          msg.proposedActions.length > 0 &&
          (() => {
            const nonTriggerActions = msg.proposedActions;
            const pendingActions = nonTriggerActions.filter(
              (a) =>
                a.type !== 'propose_accompaniment' && a.type !== 'propose_melodic_idea' && (a.status || 'pending') === 'pending'
            );

            return (
              <div className={` rounded-[var(--r-l)] p-4 space-y-3 max-w-sm mt-1 ${' bg-[var(--tentative)]/5'}`}>
                <div className="flex items-center justify-between gap-1.5">
                  <div className={`flex items-center gap-1.5 ${'text-[var(--tentative)]'}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <h5 className="font-sans font-bold text-micro">
                      Propuestas del Manager ({nonTriggerActions.length})
                    </h5>
                  </div>
                  {pendingActions.length > 1 && (
                    <button
                      onClick={() => handleConfirmAllActions(msg.id, msg.proposedActions || [])}
                      className={`text-micro font-bold font-sans px-2 py-1 rounded-[var(--r-pill)] transition-ui active:scale-[0.97] ${'bg-[var(--tentative)] text-[var(--on-tentative)] hover:bg-[var(--tentative)]'}`}
                    >
                      <ShowIcon inline emoji="⚡" />Aprobar Todos ({pendingActions.length})
                    </button>
                  )}
                </div>

                {nonTriggerActions.map((act, aIdx) => {
                  const realIdx = msg.proposedActions ? msg.proposedActions.indexOf(act) : aIdx;
                  const actStatus =
                    act.status ||
                    (msg.actionStatus === 'applied' ? 'applied' : msg.actionStatus === 'dismissed' ? 'dismissed' : 'pending');

                  return (
                    <div key={aIdx} className="space-y-2 /20 pt-2 first:border-0 first:pt-0">
                      <p
                        className={`text-xs leading-relaxed p-2.5 rounded-[var(--r-m)] font-sans ${'text-[var(--ink)] bg-[var(--surface)]'}`}
                      >
                        {act.description}
                      </p>

                      {act.type === 'propose_accompaniment' && act.accompaniment ? (
                        (() => {
                          const acc = act.accompaniment;
                          if (!acc) return null;
                          const audioKey = `${msg.id}-${aIdx}`;
                          const audioState = accompanimentAudio[audioKey];
                          return (
                            <div className="space-y-2">
                              <div
                                className={`text-micro font-sans px-2 py-1 rounded-[var(--r-s)] flex flex-wrap gap-x-2 gap-y-0.5 ${'bg-[var(--acc)]/10 text-[var(--ink)]'}`}
                              >
                                <span>{acc.bpm} BPM</span>
                                <span>· Tono {acc.keyName}</span>
                                <span>· {acc.drumPattern.toUpperCase()}</span>
                                <span>· {acc.durationSecs}s</span>
                              </div>
                              {audioState?.url ? (
                                <>
                                  <audio controls src={audioState.url} onError={(e) => e.preventDefault()} className="w-full h-9" />
                                  {audioState.savedToSong ? (
                                    <div className="text-micro font-sans text-[var(--ok)] bg-[var(--ok)]/5 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Guardada en "{audioState.savedToSong}" (Song Studio)
                                    </div>
                                  ) : songPicker[audioKey] ? (
                                    <div className={`space-y-1.5 p-2 rounded-[var(--r-s)] ${'bg-[var(--surface)]'}`}>
                                      <p className="text-micro font-sans text-[var(--ink-2)]">
                                        No he identificado la canción. Elige en cuál guardarla:
                                      </p>
                                      <Select
                                        size="sm"
                                        value={songPicker[audioKey].selectedId}
                                        onChange={(e) =>
                                          setSongPicker((prev) => ({
                                            ...prev,
                                            [audioKey]: { ...prev[audioKey], selectedId: e.target.value },
                                          }))
                                        }
                                        wrapperClassName="w-full"
                                      >
                                        <option value="">— Selecciona una canción —</option>
                                        {songPicker[audioKey].songs.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.titulo}
                                          </option>
                                        ))}
                                      </Select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSaveAccompanimentToSong(audioKey, acc, songPicker[audioKey].selectedId)
                                        }
                                        disabled={!songPicker[audioKey].selectedId || audioState.saving}
                                        className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]'}`}
                                      >
                                        {audioState.saving ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3.5 h-3.5" />
                                        )}
                                        {audioState.saving ? 'Guardando...' : 'Guardar aquí'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveAccompanimentToSong(audioKey, acc)}
                                      disabled={audioState.saving}
                                      className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'}`}
                                    >
                                      {audioState.saving ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      {audioState.saving
                                        ? 'Guardando...'
                                        : acc.songTitle || acc.songId
                                          ? `Guardar en "${acc.songTitle || 'la canción'}"`
                                          : 'Guardar en el repertorio'}
                                    </button>
                                  )}
                                  {audioState.saveError && (
                                    <div className="text-micro font-sans text-[var(--alert)]">{audioState.saveError}</div>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateAccompanimentAudio(audioKey, acc)}
                                  disabled={audioState?.loading}
                                  className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${'bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]'}`}
                                >
                                  {audioState?.loading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <PlayCircle className="w-3.5 h-3.5" />
                                  )}
                                  {audioState?.loading ? 'Sintetizando...' : 'Generar y escuchar'}
                                </button>
                              )}
                              {audioState?.error && (
                                <div className="text-micro font-sans text-[var(--alert)]">{audioState.error}</div>
                              )}
                            </div>
                          );
                        })()
                      ) : act.type === 'propose_melodic_idea' && act.melodicIdea ? (
                        (() => {
                          const idea = act.melodicIdea;
                          if (!idea) return null;
                          const instrumentLabels: Record<MelodicInstrument, string> = {
                            guitarra: 'Guitarra',
                            violin: 'Violín',
                            handpan: 'Handpan',
                            percusion: 'Percusión',
                          };
                          const audioKey = `${msg.id}-${aIdx}`;
                          const audioState = melodicIdeaAudio[audioKey];
                          return (
                            <div className="space-y-2">
                              <div
                                className={`text-micro font-sans px-2 py-1 rounded-[var(--r-s)] flex flex-wrap gap-x-2 gap-y-0.5 ${'bg-[var(--acc)]/10 text-[var(--ink)]'}`}
                              >
                                <span>{instrumentLabels[idea.instrument]}</span>
                                <span>· {idea.bpm} BPM</span>
                                <span>· Tono {idea.keyName}</span>
                                {idea.seccion && idea.seccion !== 'general' && <span>· {idea.seccion}</span>}
                                <span>· {idea.durationSecs}s</span>
                              </div>
                              {audioState?.url ? (
                                <>
                                  <audio controls src={audioState.url} onError={(e) => e.preventDefault()} className="w-full h-9" />
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadMelodicIdeaMidi(idea)}
                                    title="Abre en cualquier DAW o editor de partituras para editarla nota a nota"
                                    className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-1.5 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 ${'bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'}`}
                                  >
                                    <Download className="w-3.5 h-3.5" /> Descargar .mid
                                  </button>
                                  {audioState.savedToSong ? (
                                    <div className="text-micro font-sans text-[var(--ok)] bg-[var(--ok)]/5 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Guardada en "{audioState.savedToSong}" (Song Studio)
                                    </div>
                                  ) : songPicker[audioKey] ? (
                                    <div className={`space-y-1.5 p-2 rounded-[var(--r-s)] ${'bg-[var(--surface)]'}`}>
                                      <p className="text-micro font-sans text-[var(--ink-2)]">
                                        No he identificado la canción. Elige en cuál guardarla:
                                      </p>
                                      <Select
                                        size="sm"
                                        value={songPicker[audioKey].selectedId}
                                        onChange={(e) =>
                                          setSongPicker((prev) => ({
                                            ...prev,
                                            [audioKey]: { ...prev[audioKey], selectedId: e.target.value },
                                          }))
                                        }
                                        wrapperClassName="w-full"
                                      >
                                        <option value="">— Selecciona una canción —</option>
                                        {songPicker[audioKey].songs.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.titulo}
                                          </option>
                                        ))}
                                      </Select>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveMelodicIdeaToSong(audioKey, idea, songPicker[audioKey].selectedId)}
                                        disabled={!songPicker[audioKey].selectedId || audioState.saving}
                                        className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]'}`}
                                      >
                                        {audioState.saving ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3.5 h-3.5" />
                                        )}
                                        {audioState.saving ? 'Guardando...' : 'Guardar aquí'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveMelodicIdeaToSong(audioKey, idea)}
                                      disabled={audioState.saving}
                                      className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'}`}
                                    >
                                      {audioState.saving ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      {audioState.saving
                                        ? 'Guardando...'
                                        : idea.songTitle || idea.songId
                                          ? `Guardar en "${idea.songTitle || 'la canción'}"`
                                          : 'Guardar en el repertorio'}
                                    </button>
                                  )}
                                  {audioState.saveError && (
                                    <div className="text-micro font-sans text-[var(--alert)]">{audioState.saveError}</div>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateMelodicIdeaAudio(audioKey, idea)}
                                  disabled={audioState?.loading}
                                  className={`w-full flex items-center justify-center gap-1.5 text-micro font-bold font-sans py-2 rounded-[var(--r-s)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${'bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]'}`}
                                >
                                  {audioState?.loading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <PlayCircle className="w-3.5 h-3.5" />
                                  )}
                                  {audioState?.loading ? 'Sintetizando...' : 'Generar y escuchar'}
                                </button>
                              )}
                              {audioState?.error && (
                                <div className="text-micro font-sans text-[var(--alert)]">{audioState.error}</div>
                              )}
                            </div>
                          );
                        })()
                      ) : actStatus === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            id={`confirm-proposal-btn-${msg.id}-${aIdx}`}
                            onClick={() => handleConfirmAction(msg.id, realIdx, act)}
                            className={`flex-1 text-micro font-bold font-sans py-2 rounded-[var(--r-pill)] transition-ui cursor-pointer active:scale-[0.97] active:opacity-90 ${'bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)]'}`}
                          >
                            ✓ Aprobar esta
                          </button>
                          <Button
                            variant="neutral"
                            size="sm"
                            id={`dismiss-proposal-btn-${msg.id}-${aIdx}`}
                            onClick={() => handleDismissAction(msg.id, realIdx, act)}
                          >
                            Descartar
                          </Button>
                        </div>
                      ) : actStatus === 'applied' ? (
                        <div className="text-micro font-sans text-[var(--ok)] bg-[var(--ok)]/5 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Aprobado e insertado
                        </div>
                      ) : (
                        <div className={`text-micro font-sans rounded-[var(--r-s)] p-2 ${'text-[var(--ink-2)] bg-[var(--bg)]'}`}>
                          Propuesta descartada
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
      </div>
    </div>
  );

}
