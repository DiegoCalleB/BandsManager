/**
 * Hoja de Iris: mezclador de las pistas separadas de la canción, motor y botón de volver a separar
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Cpu, Sliders, X } from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { IconButton } from "../ui";
import { useSongStudio } from "./SongStudioContext";
import { SongStudioIdeaCard } from "./SongStudioIdeaCard";

/**
 * Hoja de Iris: mezclador de las pistas separadas de la canción, motor y botón de volver a separar
 * @returns Sección de interfaz.
 */
export function SongStudioIrisSheet() {
  const { showIrisPanel, setShowIrisPanel, song, metaStems, setShowMoisesStemsModal, irisIdea, fuenteIris, isSeparatingStemsAi } = useSongStudio();
  return (
    <>
      {/* HOJA DE IRIS: módulo propio de la canción, fuera del estudio de ideas */}
      {showIrisPanel && (
        <ModalPortal isOpen onClose={() => setShowIrisPanel(false)}>
          <div className="fixed inset-0 z-[10001] bg-[var(--scrim)]/85 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-label="Iris, pistas de la canción">
            <div className="bg-[var(--surface)] rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-3 sm:p-6 space-y-4 text-[var(--ink)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--acc)]" /> Iris · {song.titulo}
                  {metaStems?.motor && (
                    <span className="text-xs font-semibold text-[var(--ink-2)]">
                      {metaStems.motor.split('(')[0].trim()}{metaStems.degradado ? ' (degradado)' : ''}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMoisesStemsModal(irisIdea ?? fuenteIris)}
                    disabled={isSeparatingStemsAi || !fuenteIris}
                    className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-110 text-[var(--on-acc)] font-bold text-xs flex items-center gap-1.5 transition-ui cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Elegir pistas y motor (Iris Studio, Iris Cloud o Iris Básico)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isSeparatingStemsAi ? 'Separando...' : irisIdea ? 'Volver a separar' : 'Separar con Iris'}</span>
                  </button>
                  <IconButton label="Cerrar Iris" type="button" onClick={() => setShowIrisPanel(false)}>
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>
              </div>
              {irisIdea ? (
                <div className="space-y-6"><SongStudioIdeaCard idea={irisIdea} opts={{ iris: true }} /></div>
              ) : (
                <p className="text-sm text-[var(--ink-2)]">Aún no hay pistas. Separa la canción con Iris y aparecerán aquí.</p>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
