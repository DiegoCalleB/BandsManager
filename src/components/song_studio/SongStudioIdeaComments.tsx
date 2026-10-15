import { getIdeaTracks } from './ideaTracks';
/**
 * Hilo de comentarios de una idea
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { SongAudioIdea } from "../../types";
import { IconButton, Input, Select } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useSongStudio } from "./SongStudioContext";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface SongStudioIdeaCommentsProps {
  idea: SongAudioIdea;
  currentTime: number;
}

/**
 * Hilo de comentarios de una idea
 * @param props Estado y callbacks del contenedor ({@link SongStudioIdeaCommentsProps}).
 * @returns Sección de interfaz.
 */
export function SongStudioIdeaComments({ idea, currentTime }: SongStudioIdeaCommentsProps) {
  const { jumpToTime, formatTime, handleDeleteComment, setCommentTimeTagMap, commentTrackTagMap, setCommentTrackTagMap, commentTextMap, setCommentTextMap, handleAddComment } = useSongStudio();
  return (
    <>
      {/* Feedback & Comments Thread */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--tentative)]" />
          Comentarios y Críticas del Grupo ({(idea.comentarios || []).length})
        </span>

        {/* Comment items list */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(idea.comentarios || []).map((comm) => (
            <div
              key={comm.id}
              className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs flex items-start justify-between gap-2 group"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[var(--tentative)]/80 font-sans">{comm.autor}:</span>
                  {comm.instrumento && (
                    <span
                      className="px-1.5 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ink)] font-sans text-micro font-bold"
                      title="Comentario referido a esta pista"
                    >
                      <ShowIcon inline emoji="🎚️" />{comm.instrumento}
                    </span>
                  )}
                  {comm.timestampSegundos !== undefined && comm.timestampSegundos > 0 && (
                    <button
                      type="button"
                      onClick={() => jumpToTime(idea, comm.timestampSegundos!)}
                      className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-sans text-micro font-bold hover:bg-[var(--acc)]/30 cursor-pointer"
                    >
                      <ShowIcon inline emoji="⏱️" />{formatTime(comm.timestampSegundos)}
                    </button>
                  )}
                </div>
                <p className="text-[var(--ink-2)] mt-0.5">{comm.texto}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-micro font-sans text-[var(--ink-2)]">{comm.fecha}</span>
                <IconButton
                  label="Borrar comentario"
                  variant="danger"
                  size="icon-xs"
                  type="button"
                  onClick={() => handleDeleteComment(idea, comm.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment input */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <button
            type="button"
            onClick={() =>
              setCommentTimeTagMap((prev) => ({
                ...prev,
                [idea.id]: Math.floor(currentTime),
              }))
            }
            className="px-2 py-1 rounded-[var(--r-pill)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-micro font-sans text-[var(--acc)] font-bold whitespace-nowrap cursor-pointer"
            title="Añadir timestamp actual"
          >
            <ShowIcon inline emoji="⏱️" />@ {formatTime(currentTime)}
          </button>

          {getIdeaTracks(idea).length > 1 && (
            <Select
              size="sm"
              value={commentTrackTagMap[idea.id] || ''}
              onChange={(e) =>
                setCommentTrackTagMap((prev) => ({
                  ...prev,
                  [idea.id]: e.target.value || null,
                }))
              }
              title="Referir este comentario a una pista concreta"
            >
              <option value="">General</option>
              {getIdeaTracks(idea).map((tr) => (
                <option key={tr.id} value={tr.instrumento || tr.nombre}>
                  {tr.nombre}
                </option>
              ))}
            </Select>
          )}

          <Input
            size="sm"
            type="text"
            value={commentTextMap[idea.id] || ''}
            onChange={(e) =>
              setCommentTextMap((prev) => ({
                ...prev,
                [idea.id]: e.target.value,
              }))
            }
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea)}
            placeholder="Escribe tu crítica o sugerencia…"
            className="flex-1"
          />

          <IconButton
            label="Enviar"
            type="button"
            onClick={() => handleAddComment(idea)}
          >
            <Send className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
    </>
  );
}
