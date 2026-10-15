/**
 * Aviso que sugiere marcar la pista 1 como diálogo cuando está como canción.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Aviso que sugiere marcar la pista 1 como diálogo cuando está como canción.
 * @returns Sección de interfaz.
 */
export function FirstTrackHint() {
  const { tracks, handleUpdateTrack } = useLiveConcertAlbum();
  return (
    <>
      {/* Banner suggestion for Pista 1 if it's currently set as song */}
      {tracks.length > 0 && tracks[0].type === "musica" && (
        <div className="p-3 bg-[var(--tentative)]/5 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--tentative)] animate-fade-in">
          <div className="flex items-center gap-2">
            <span>
              <strong>
                <ShowIcon inline emoji="💡" />¿La Pista 1 es la presentación/speech de la banda?
              </strong>{" "}
              Si incluye palabras de saludo o presentación (incluso
              con música de fondo o ráfagas), conviértela a Speech:
            </span>
          </div>
          <button
            onClick={() => {
              handleUpdateTrack(1, "type", "dialogo");
              if (
                tracks[0].title.startsWith("Pista 1") ||
                tracks[0].title.startsWith("Tema 1")
              ) {
                handleUpdateTrack(
                  1,
                  "title",
                  "Presentación e Intro del Concierto",
                );
              }
            }}
            className="px-3 py-1 bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] font-bold rounded-[var(--r-pill)] text-xs shrink-0 shadow transition-ui flex items-center gap-1"
          >
            <ShowIcon inline emoji="🗣️" />Convertir pista 1 a speech / presentación
          </button>
        </div>
      )}
    </>
  );
}
