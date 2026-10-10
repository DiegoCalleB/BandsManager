/**
 * Panel final con el disco generado y el guardado en el catálogo de la banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, Disc3, ExternalLink, FileCode, ListPlus } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Panel final con el disco generado y el guardado en el catálogo de la banda.
 * @returns Sección de interfaz.
 */
export function GeneratedAlbumResult() {
  const { generatedResult, handleCreateSetlistFromConcert, handleSaveToCatalog, savedSuccessMsg } = useLiveConcertAlbum();
  return (
    <>
      {generatedResult && (
        <div className="p-5 rounded-[var(--r-l)] bg-[var(--ok)]/40  space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--ok)]/20 flex items-center justify-center text-[var(--ink)]">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ok)]">
                  ¡Disco generado con éxito!
                </h3>
                <p className="text-xs text-[var(--ink-2)]">
                  Archivos cortados y manifiesto web interactivo listos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={generatedResult.deliverablePath}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                Abrir Repertorio Web
              </a>

              <a
                href={generatedResult.deliverablePath.replace(
                  "/index.html",
                  "/repertoire.cue",
                )}
                download="repertoire.cue"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1.5"
                title="Descargar mapa de índices para DAWs (reaper, Cubase, ableton, logic)"
              >
                <FileCode className="w-3.5 h-3.5 text-[var(--tentative)]" />{" "}
                CUE Sheet (.cue)
              </a>

              <button
                onClick={handleCreateSetlistFromConcert}
                className="px-3.5 py-1.5 text-xs font-bold rounded-[var(--r-pill)] bg-[var(--tentative)] text-[var(--on-tentative)] hover:bg-[var(--tentative)]/80 flex items-center gap-1.5 transition-ui"
              >
                <ListPlus className="w-3.5 h-3.5 text-[var(--tentative)]" />{" "}
                Crear Setlist
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--ink-2)]">
              ¿Deseas agregar formalmente este nuevo Álbum con todos sus
              temas a la Discografía de la Banda?
            </p>

            <Button
              variant="primary"
              onClick={handleSaveToCatalog}
              className="items-center gap-2"
            >
              <Disc3 className="w-4 h-4" /> <ShowIcon inline emoji="💾" />Guardar como álbum en la
              discografía
            </Button>
          </div>

          {savedSuccessMsg && (
            <div className="p-3 bg-[var(--ok)]/20 text-[var(--ink)] text-xs rounded-[var(--r-s)] font-bold text-center animate-fade-in">
              ¡Álbum e individualidades guardadas correctamente en la
              Discografía de la Banda!
            </div>
          )}
        </div>
      )}
    </>
  );
}
