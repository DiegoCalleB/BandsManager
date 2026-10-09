/**
 * Controles de la cabecera: volumen maestro, pantalla completa y cerrar
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { VolumeX, Volume2, Minimize2, Maximize2, X } from "lucide-react";
import { IconButton } from "../ui";
import React, { Dispatch, SetStateAction } from "react";
import { useSongStudio } from "./SongStudioContext";

/**
 * Controles de la cabecera: volumen maestro, pantalla completa y cerrar
 * @returns Sección de interfaz.
 */
export function SongStudioHeaderControls() {
  const { setMasterVolume, masterVolume, toggleIsFullScreen, isFullScreen, onClose } = useSongStudio();
  return (
    <>
<div className="flex items-center gap-2">
              {/* Volumen master de salida — control personal de escucha, no se guarda en la canción */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-m)] bg-[var(--ink)]/5"
                title="Volumen master de salida (solo tu escucha, no afecta a la mezcla de la banda)"
              >
                <button
                  type="button"
                  onClick={() => setMasterVolume((v) => (v > 0 ? 0 : 1))}
                  className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer shrink-0"
                >
                  {masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.01}
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-micro font-sans text-[var(--ink-2)] w-8 text-right">{Math.round(masterVolume * 100)}%</span>
              </div>

              <button
                type="button"
                onClick={toggleIsFullScreen}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                  isFullScreen
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold hover:bg-[var(--acc)]/60'
                    : 'bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]'
                }`}
                title={isFullScreen ? 'Salir de Pantalla Completa' : 'Poner Modo Studio en Pantalla Completa'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-[var(--acc-ink)]" />
                    <span className="hidden sm:inline">Salir pantalla completa</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-[var(--acc)]" />
                    <span className="hidden sm:inline">Pantalla completa HD</span>
                  </>
                )}
              </button>

              <IconButton
                label="Cerrar"
                type="button"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </IconButton>
            </div>
    </>
  );
}
