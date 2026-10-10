/**
 * Cajón con la lista completa de temas y bloques del repertorio.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Headphones,ListMusic,Play,Sliders,X } from "lucide-react";
import { getIdeaTracks,ideaDeStemsDeCancion } from "../../utils/irisTracks";
import { Button,IconButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { getBlockMeta } from "./performanceModel";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Cajón con la lista completa de temas y bloques del repertorio.
 * @returns Sección de interfaz.
 */
export function PerformanceSongDrawer() {
  const { showSongListDrawer, songsWithIrisCount, songsInSetlistCount, setShowSongListDrawer, allItems, songs, currentIndex, setCurrentIndex, handleLaunchPractice, handleLaunchStudio } = useSetlistPerformance();
  return (
    <>
      {showSongListDrawer && (
  <div className="fixed inset-0 z-[9999] flex justify-end bg-[var(--scrim)]/75 animate-in fade-in duration-150">
    <div className="w-full max-w-md h-full bg-[var(--surface)] flex flex-col text-[var(--ink)]">
      {/* Drawer Header */}
      <div className="p-4 flex items-center justify-between bg-[var(--surface)]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] flex items-center justify-center">
          <ListMusic className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)]">
            Repertorio y pistas iris
          </h3>
          <p className="text-xs text-[var(--ink-2)]">
            {songsWithIrisCount} de {songsInSetlistCount} temas con
            pistas Iris listas
          </p>
        </div>
      </div>
      <IconButton
        label="Cerrar"
        onClick={() => setShowSongListDrawer(false)}
      >
        <X className="w-5 h-5" />
      </IconButton>
      </div>

      {/* Drawer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {allItems.map((item, idx) => {
        const isItemBlock = item.tipoItem === "bloque";
        const song = !isItemBlock
          ? songs.find((s) => s.id === item.songId)
          : undefined;
        const isCurrent = idx === currentIndex;
        const songIrisIdea = song ? ideaDeStemsDeCancion(song) : null;
        const stemCount = songIrisIdea
          ? getIdeaTracks(songIrisIdea).length
          : 0;

        if (isItemBlock) {
          const meta = getBlockMeta(item);
          return (
            <div
              key={item.id}
              onClick={() => {
                setCurrentIndex(idx);
                setShowSongListDrawer(false);
              }}
              className={`p-3 rounded-[var(--r-m)] flex items-center justify-between cursor-pointer transition ${
                isCurrent
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "bg-[var(--bg)]/60 text-[var(--ink-2)]"
              } hover:brightness-95`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg"><ShowIcon inline emoji={meta.icon} /></span>
                <div>
                  <div className="text-xs font-bold text-[var(--ink)]">
                    {item.tituloCustom || meta.label}
                  </div>
                  <div className="text-micro text-[var(--ink-2)] font-sans">
                    Bloque de escenario
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-[var(--sunken)] text-micro text-[var(--ink-2)] font-sans">
                Ir al bloque
              </span>
            </div>
          );
        }

        if (!song) return null;

        return (
          <div
            key={item.id}
            className={`p-3 rounded-[var(--r-m)] transition flex flex-col gap-2.5 ${
              isCurrent
                ? "bg-[var(--acc)]/10 "
                : "bg-[var(--surface)]/80 "
            } hover:brightness-95`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-6 h-6 rounded-[var(--r-s)] flex items-center justify-center text-xs font-sans font-bold shrink-0 ${
                    isCurrent
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "bg-[var(--sunken)] text-[var(--ink-2)]"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h4
                    className={`text-xs font-bold truncate ${isCurrent ? "text-[var(--acc)]" : "text-[var(--ink)]"}`}
                  >
                    {song.titulo}
                  </h4>
                  <div className="flex items-center gap-2 text-micro text-[var(--ink-2)] font-sans">
                    {song.tonalidad && (
                      <span className="text-[var(--acc)]/70">
                        Tono: {song.tonalidad}
                      </span>
                    )}
                    {song.bpm ? <span>· {song.bpm} BPM</span> : null}
                    {song.duracion ? (
                      <span>· {song.duracion}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {songIrisIdea ? (
                <span className="shrink-0 px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/20 text-[var(--ink)] flex items-center gap-1">
                  <Headphones className="w-2.5 h-2.5" />
                  {stemCount > 0 ? `${stemCount} pistas` : "Iris"}
                </span>
              ) : (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-micro text-[var(--ink-2)] bg-[var(--sunken)]/50">
                  Sin Iris
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              {songIrisIdea && (
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => {
                    setShowSongListDrawer(false);
                    handleLaunchPractice(song, songIrisIdea);
                  }}
                  className="flex-1 items-center justify-center gap-1"
                  title="Modo Ensayo individual con las pistas aisladas de este tema"
                >
                  <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>Modo ensayo</span>
                </Button>
              )}

              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => {
                  setShowSongListDrawer(false);
                  handleLaunchStudio(song);
                }}
                className="items-center justify-center gap-1"
                title="Abrir Studio multipista completo de este tema"
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" />
                <span className="hidden sm:inline">Studio</span>
              </Button>

              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowSongListDrawer(false);
                }}
                className="items-center justify-center gap-1"
                title="Mostrar en el atril"
              >
                <Play className="w-3 h-3 text-[var(--acc)]" />
                <span>Atril</span>
              </Button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  </div>
      )}
    </>
  );
}
