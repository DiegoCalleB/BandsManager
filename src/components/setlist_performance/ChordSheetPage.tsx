import {
Info,
Pause,
Play,
RotateCcw
} from "lucide-react";
import React from "react";
import {
ChordSection
} from "../../utils/chordUtils";
import { Button } from '../ui';
import { ShowIcon } from '../ui/ShowIcon';

// Fallback cuando la canción todavía no tiene un documento escaneado: el texto de acordes y
// letra ocupa casi toda la pantalla — es lo único que un músico necesita leer sin tocar nada,
// así que la ficha (tono/tempo/duración/afinación) se reduce a una línea y la estructura/
// progresión quedan colapsadas detrás de un botón"ⓘ", en vez de robarle espacio por defecto.
export const ChordSheetPage: React.FC<{
  chords: string;
  sections: ChordSection[];
  currentSectionIndex: number;
  onAdvanceSection: () => void;
  onRetreatSection: () => void;
  structure: string;
  progression: string;
  transposedKey: string;
  originalKey: string;
  transpose: number;
  liveTransposeOffset: number;
  onLiveTransposeChange: (offset: number) => void;
  bpm?: number;
  duracion?: string;
  afinacion?: string;
  fontSizeClass: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  glareMode: boolean;
  teleprompterMode: "sections" | "scroll";
  onToggleTeleprompterMode: () => void;
  isTeleprompterPlaying: boolean;
  onToggleTeleprompterPlay: () => void;
  teleprompterSpeed: number;
  onChangeTeleprompterSpeed: (speed: number) => void;
  onResetTeleprompterScroll: () => void;
  teleprompterScrollRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  chords,
  sections,
  currentSectionIndex,
  onAdvanceSection,
  onRetreatSection,
  structure,
  progression,
  transposedKey,
  originalKey,
  transpose,
  liveTransposeOffset,
  onLiveTransposeChange,
  bpm,
  duracion,
  afinacion,
  fontSizeClass,
  showDetails,
  onToggleDetails,
  glareMode,
  teleprompterMode,
  onToggleTeleprompterMode,
  isTeleprompterPlaying,
  onToggleTeleprompterPlay,
  teleprompterSpeed,
  onChangeTeleprompterSpeed,
  onResetTeleprompterScroll,
  teleprompterScrollRef,
}) => {
  const hasMultipleSections = sections.length >= 2;
  const currentSection = hasMultipleSections
    ? sections[currentSectionIndex]
    : null;
  const chordTextClass = glareMode
    ? "text-[var(--ink)] font-bold"
    : "text-[var(--acc)]";
  const borderClass = "";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Ficha compacta con transposición en tiempo real y selector de modo */}
      <div
        className={`shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-2 text-xs sm:text-sm font-sans ${borderClass} bg-[var(--sunken)]`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de tono con transposición en tiempo real */}
          <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-0.5 rounded">
            <button
              type="button"
              onClick={() => onLiveTransposeChange(liveTransposeOffset - 1)}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/15 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition cursor-pointer"
              title="Bajar 1 semitono (-1)"
            >
              -
            </button>
            <span
              className={
                glareMode
                  ? "text-[var(--ok)] font-bold"
                  : "text-[var(--ok)] font-bold"
              }
            >
              <ShowIcon inline emoji="🎯" />{transposedKey || "Sin tono"}
            </span>
            <button
              type="button"
              onClick={() => onLiveTransposeChange(liveTransposeOffset + 1)}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/15 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition cursor-pointer"
              title="Subir 1 semitono (+1)"
            >
              +
            </button>
            {liveTransposeOffset !== 0 && (
              <button
                type="button"
                onClick={() => onLiveTransposeChange(0)}
                className="ml-1 text-micro px-1 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 transition cursor-pointer"
                title="Restablecer al tono del repertorio"
              >
                {liveTransposeOffset > 0
                  ? `+${liveTransposeOffset}`
                  : liveTransposeOffset}{" "}
                ⟲
              </button>
            )}
          </div>

          {originalKey && (transpose !== 0 || liveTransposeOffset !== 0) && (
            <span className="text-xs text-[var(--ink-2)] font-normal">
              (orig: {originalKey})
            </span>
          )}
          {bpm && (
            <span
              className={
                glareMode
                  ? "text-[var(--tentative)]"
                  : "text-[var(--tentative)]"
              }
            >
              {bpm} BPM
            </span>
          )}
          {duracion && (
            <span
              className={glareMode ? "text-[var(--ok)]" : "text-[var(--ink-2)]"}
            >
              {duracion}
            </span>
          )}
          {afinacion && (
            <span
              className={
                glareMode ? "text-[var(--acc)]" : "text-[var(--tentative)]/80"
              }
            >
              {afinacion}
            </span>
          )}
          {(structure || progression) && (
            <button
              onClick={onToggleDetails}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                showDetails
                  ? glareMode
                    ? "bg-[var(--sunken)] text-[var(--ink)]"
                    : "bg-[var(--ink)]/15 text-[var(--ink)]"
                  : glareMode
                    ? "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
              title="Estructura y progresión de acordes"
            >
              <Info className="w-3 h-3" /> detalles
            </button>
          )}
        </div>

        {/* Selector de modo Teleprompter vs Secciones */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTeleprompterMode}
            className={`px-2.5 py-1 text-xs font-sans font-bold rounded-[var(--r-pill)] transition flex items-center gap-1.5 cursor-pointer ${
              teleprompterMode === "scroll"
                ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
            title={
              teleprompterMode === "scroll"
                ? "Cambiar a modo pedal por secciones"
                : "Cambiar a modo teleprompter scroll continuo"
            }
          >
            <span>
              {teleprompterMode === "scroll"
                ? "Teleprompter Auto"
                : "Modo Secciones"}
            </span>
          </button>
        </div>
      </div>

      {showDetails && (structure || progression) && (
        <div
          className={`shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-2 text-xs sm:text-sm ${borderClass} ${glareMode ? "bg-[var(--sunken)]" : "bg-[var(--sunken)]"}`}
        >
          {structure && (
            <p
              className={
                glareMode
                  ? "text-[var(--tentative)]"
                  : "text-[var(--tentative)]"
              }
            >
              <span
                className={
                  glareMode
                    ? "text-[var(--tentative)] font-bold"
                    : "text-[var(--tentative)] font-bold"
                }
              >
                <ShowIcon inline emoji="🎵" />Estructura:{" "}
              </span>
              {structure}
            </p>
          )}
          {progression && (
            <p
              className={glareMode ? "text-[var(--ok)]" : "text-[var(--ok)]"}
            >
              <span
                className={
                  glareMode
                    ? "text-[var(--ok)] font-bold"
                    : "text-[var(--ok)] font-bold"
                }
              >
                <ShowIcon inline emoji="🎸" />Progresión:{" "}
              </span>
              {progression}
            </p>
          )}
        </div>
      )}

      {/* MODO TELEPROMPTER AUTO-SCROLL */}
      {teleprompterMode === "scroll" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de control del teleprompter */}
          <div
            className={`shrink-0 flex items-center justify-between gap-3 px-4 py-2 ${borderClass} ${glareMode ? "bg-[var(--sunken)]" : "bg-[var(--surface)]/90"}`}
          >
            <div className="flex items-center gap-2">
              <Button
                variant={isTeleprompterPlaying ? "primary" : "primary"}
                size="xs"
                type="button"
                onClick={onToggleTeleprompterPlay}
                className="items-center gap-1.5"
                title="Pausar o reanudar teleprompter (o pulsar Espacio)"
              >
                {isTeleprompterPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausa (Espacio)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Rodar (Espacio)</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={onResetTeleprompterScroll}
                className="px-2.5 py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-pill)] text-xs font-sans flex items-center gap-1 transition cursor-pointer"
                title="Rebobinar al principio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
            </div>

            {/* Velocidades */}
            <div className="flex items-center gap-1 text-xs font-sans">
              <span className="text-[var(--ink-2)] hidden sm:inline mr-1">
                Vel:
              </span>
              {[0.5, 1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onChangeTeleprompterSpeed(speed)}
                  className={`px-2 py-1 rounded text-xs transition cursor-pointer ${
                    teleprompterSpeed === speed
                      ? "bg-[var(--acc)]/20 text-[var(--ink)] font-bold"
                      : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Contenedor de lectura continua */}
          <div
            ref={teleprompterScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth"
          >
            <pre
              className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words pb-32 ${fontSizeClass} ${chordTextClass}`}
            >
              {chords}
            </pre>
          </div>
        </div>
      ) : hasMultipleSections ? (
        // NAVEGACIÓN POR SECCIONES (PEDAL / TAP)
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`shrink-0 text-center py-1.5 text-xs font-sans ${borderClass} ${glareMode ? "text-[var(--ink-2)]" : "text-[var(--ink-2)]"}`}
          >
            Parte {currentSectionIndex + 1}/{sections.length}
            {currentSection?.title && (
              <span
                className={
                  glareMode
                    ? "text-[var(--acc)] font-bold"
                    : "text-[var(--tentative)]/80 font-bold"
                }
              >
                {" "}
                · {currentSection.title}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <pre
              className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words text-center ${fontSizeClass} ${chordTextClass}`}
            >
              {currentSection?.body}
            </pre>
          </div>
          <div
            className={`shrink-0 flex items-center gap-2 p-3 ${borderClass}`}
          >
            <button
              onClick={onRetreatSection}
              disabled={currentSectionIndex === 0}
              className={`px-4 py-2.5 disabled:opacity-30 rounded-[var(--r-pill)] text-sm font-sans font-bold transition ${
                glareMode
                  ? "bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]"
                  : "bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]"
              }`}
            >
              <ShowIcon inline emoji="◀" />Parte anterior
            </button>
            <Button
              variant="primary"
              onClick={onAdvanceSection}
              className="flex-1"
            >
              Siguiente parte <ShowIcon inline emoji="▶" />
            </Button>
          </div>
        </div>
      ) : (
        // Sin encabezados de sección detectados: se muestra todo el cifrado de una vez, con scroll manual
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <pre
            className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words ${fontSizeClass} ${chordTextClass}`}
          >
            {chords}
          </pre>
        </div>
      )}
    </div>
  );
};
