/**
 * Título del corte con presets rápidos para canciones y discursos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Music2, Sparkles, X } from "lucide-react";
import { IconButton, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";
import { TrackCutItem } from "./types";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface TrackTitleRowProps {
  track: TrackCutItem;
}

/**
 * Título del corte con presets rápidos para canciones y discursos.
 * @returns Sección de interfaz.
 */
export function TrackTitleRow({ track }: TrackTitleRowProps) {
  const { handleUpdateTrack, handleSuggestTitleFromSpeech } = useLiveConcertAlbum();
  return (
    <>
      {/* Prominent Dedicated Title Row with Quick Presets */}
      <div className="pt-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {track.type === "musica" ? (
              <Music2 className="w-4 h-4 text-[var(--acc)]" />
            ) : (
              <span className="text-base"><ShowIcon inline emoji="🗣️" /></span>
            )}
            <label className="text-xs font-bold text-[var(--ink-2)]">
              {track.type === "musica"
                ? "Nombre del Tema:"
                : "Nombre del Speech:"}
            </label>
          </div>

          <div className="flex-1 relative">
            <Input
              size="sm"
              type="text"
              value={track.title}
              onChange={(e) =>
                handleUpdateTrack(
                  track.index,
                  "title",
                  e.target.value,
                )
              }
              className="w-full"
              placeholder={
                track.type === "musica"
                  ? `Ej: Tema ${track.index} (o escribe el nombre de la canción)...`
                  : `Ej: Presentación de la banda / Saludo al público / Anécdota...`
              }
            />
            {track.title && (
              <IconButton
                label="Limpiar nombre"
                size="icon-xs"
                type="button"
                onClick={() =>
                  handleUpdateTrack(track.index, "title", "")
                }
                className="absolute right-2.5 top-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>
        </div>

        {/* Quick Presets for Songs and Speeches */}
        <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-6 text-xs">
          <span className="text-[var(--ink-2)] text-micro font-semibold">
            Sugerencias rápidas:
          </span>
          {track.type === "dialogo" ? (
            <>
              {[
                "Presentación de la Banda",
                "Saludo al Público",
                "Anécdota / Historia",
                "Agradecimientos",
                "Presentación del Tema",
                "Despedida / Bises",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    handleUpdateTrack(
                      track.index,
                      "title",
                      preset,
                    )
                  }
                  className="px-2 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)] text-micro font-medium transition-ui"
                >
                  + {preset}
                </button>
              ))}
              {track.speechTranscription && (
                <button
                  type="button"
                  onClick={() =>
                    handleSuggestTitleFromSpeech(track.index)
                  }
                  className="px-2 py-0.5 rounded bg-[var(--tentative)] hover:bg-[var(--tentative)]/80 text-[var(--on-tentative)] text-micro font-bold transition-ui flex items-center gap-1"
                  title="Extrae las primeras palabras del speech para usarlas como nombre"
                >
                  <Sparkles className="w-3 h-3 text-[var(--tentative)]" />
                  <span>Usar frase del speech</span>
                </button>
              )}
            </>
          ) : (
            <>
              {[
                "Intro Instrumental",
                "Solo / Jam",
                "Acústico",
                "Fin de Concierto / Outro",
                "Bis / Encore",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (
                      track.title &&
                      !track.title.includes(preset)
                    ) {
                      handleUpdateTrack(
                        track.index,
                        "title",
                        `${track.title} (${preset})`,
                      );
                    } else {
                      handleUpdateTrack(
                        track.index,
                        "title",
                        `${preset} ${track.index}`,
                      );
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] text-micro font-medium transition-ui"
                >
                  + {preset}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
