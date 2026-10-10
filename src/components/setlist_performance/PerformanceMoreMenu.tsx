/**
 * Menú de más opciones: brillo, descanso, modo avión y pantalla completa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { FileText,Headphones,Image as ImageIcon,Maximize,Minimize,Moon,Plane,Sliders,StickyNote,Sun,Type } from "lucide-react";
import { PopoverAncla } from "../ui/PopoverAncla";
import { FONT_SIZES } from "./performanceModel";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Menú de más opciones: brillo, descanso, modo avión y pantalla completa.
 * @returns Sección de interfaz.
 */
export function PerformanceMoreMenu() {
  const { showMoreMenu, setShowMoreMenu, glareMode, isBlock, currentSong, irisStemIdea, handleLaunchPractice, onOpenStudioModal, handleLaunchStudio, setGlareMode, setIsResting, notes, setShowNotes, showNotes, hasChordsText, hasScannedSheet, setManualViewOverride, effectiveViewMode, showScannedSheet, setFontSizeIdx, toggleFullscreen, isFullscreen, setShowFlightModeInfo } = useSetlistPerformance();
  return (
    <>
      {showMoreMenu && (
      <>
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowMoreMenu(false)}
        />
        <PopoverAncla
          className={`absolute right-0 top-full mt-1.5 z-40 w-64 rounded-[var(--r-m)] p-1.5 space-y-0.5 text-sm ${
            glareMode
              ? "bg-[var(--surface)] border-text-[var(--ink-2)] text-[var(--ink)]"
              : "bg-[var(--surface)] text-[var(--ink)]"
          }`}
        >
          {/* Studio & Ensayo shortcuts inside menu */}
          {!isBlock && currentSong && (
            <>
              {irisStemIdea && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleLaunchPractice();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition font-semibold ${
                    glareMode
                      ? "hover:bg-[var(--sunken)] text-[var(--ok)]"
                      : "hover:bg-[var(--ink)]/10 text-[var(--ok)]"
                  }`}
                >
                  <Headphones className="w-4 h-4 shrink-0 text-[var(--ok)]" />
                  <span>Sala de ensayo (pistas iris)</span>
                </button>
              )}

              {onOpenStudioModal && (
                <button
                  id="btn-stage-studio-mode"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleLaunchStudio();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${
                    glareMode
                      ? "hover:bg-[var(--sunken)] text-[var(--tentative)]"
                      : "hover:bg-[var(--ink)]/10 text-[var(--tentative)]"
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0 text-[var(--tentative)]" />
                  <span>Abrir modo Studio</span>
                </button>
              )}

              <div
                className={`my-1 ${glareMode ? "h-px bg-[var(--sunken)]" : ""}`}
              />
            </>
          )}

          <button
            onClick={() => {
              setGlareMode((v) => !v);
              setShowMoreMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"} ${glareMode ? "text-[var(--accent-alt)]" : ""}`}
          >
            <Sun className="w-4 h-4 shrink-0" />{" "}
            {glareMode ? "Quitar" : "Activar"} alto contraste
          </button>

          <button
            onClick={() => {
              setIsResting(true);
              setShowMoreMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"}`}
          >
            <Moon className="w-4 h-4 shrink-0" /> Modo descanso (ahorra
            batería)
          </button>

          {!isBlock && notes && (
            <button
              onClick={() => {
                setShowNotes((v) => !v);
                setShowMoreMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"} text-[var(--acc)]`}
            >
              <StickyNote className="w-4 h-4 shrink-0" />{" "}
              {showNotes ? "Ocultar" : "Ver"} notas del tema
            </button>
          )}

          {!isBlock && hasChordsText && hasScannedSheet && (
            <button
              onClick={() => {
                setManualViewOverride(
                  effectiveViewMode === "sheet" ? "chords" : "sheet",
                );
                setShowMoreMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"}`}
            >
              {showScannedSheet ? (
                <FileText className="w-4 h-4 shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 shrink-0" />
              )}
              Ver{" "}
              {showScannedSheet
                ? "acordes en texto"
                : "documento original"}
            </button>
          )}

          {!isBlock && !showScannedSheet && (
            <button
              onClick={() => {
                setFontSizeIdx((i) => (i + 1) % FONT_SIZES.length);
                setShowMoreMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"}`}
            >
              <Type className="w-4 h-4 shrink-0" /> Cambiar tamaño de
              letra
            </button>
          )}

          <button
            onClick={() => {
              toggleFullscreen();
              setShowMoreMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"}`}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 shrink-0" />
            ) : (
              <Maximize className="w-4 h-4 shrink-0" />
            )}
            {isFullscreen ? "Salir de" : "Entrar en"} pantalla completa
          </button>

          <button
            onClick={() => {
              setShowFlightModeInfo((v) => !v);
              setShowMoreMenu(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ? "hover:bg-[var(--sunken)]" : "hover:bg-[var(--ink)]/10"} text-[var(--ink-2)]`}
          >
            <Plane className="w-4 h-4 shrink-0" /> Sobre el modo avión
          </button>
        </PopoverAncla>
      </>
      )}
    </>
  );
}
