/**
 * Página del tema: zonas táctiles laterales y bloque, escaneado o cifrado.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronLeft,ChevronRight } from "lucide-react";
import { IconButton } from "../ui";
import { ChordSheetPage } from "./ChordSheetPage";
import { FONT_SIZES } from "./performanceModel";
import { ScannedSheetPage } from "./ScannedSheetPage";
import { useSetlistPerformance } from "./SetlistPerformanceContext";
import { TeleprompterBlockPage } from "./TeleprompterBlockPage";

/**
 * Página del tema: zonas táctiles laterales y bloque, escaneado o cifrado.
 * @returns Sección de interfaz.
 */
export function PerformancePage() {
  const { isFirst, handlePrev, isLast, handleNext, isBlock, currentItem, blockMeta, glareMode, showScannedSheet, currentSong, chords, chordSections, currentSectionIndex, handleAdvance, handleRetreat, structure, progression, transposedKey, effectiveTranspose, liveTransposeOffset, setLiveTransposeOffset, fontSizeIdx, showDetails, setShowDetails, teleprompterMode, setTeleprompterMode, isTeleprompterPlaying, setIsTeleprompterPlaying, teleprompterSpeed, setTeleprompterSpeed, teleprompterScrollRef } = useSetlistPerformance();
  return (
    <>
      <div className="relative flex-1 min-h-0">
  {!isFirst && (
    <IconButton
      label="← Anterior"
      onClick={handlePrev}
      className="absolute left-0 top-0 bottom-0 w-[28%] max-w-32 z-10 flex opacity-40"
    >
      <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--ink)]" />
    </IconButton>
  )}
  {!isLast && (
    <IconButton
      label="Siguiente →"
      onClick={handleNext}
      className="absolute right-0 top-0 bottom-0 w-[28%] max-w-32 z-10 flex opacity-40"
    >
      <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--ink)]" />
    </IconButton>
  )}

  {isBlock ? (
    <TeleprompterBlockPage
      item={currentItem}
      meta={blockMeta!}
      glareMode={glareMode}
    />
  ) : showScannedSheet ? (
    <ScannedSheetPage song={currentSong!} />
  ) : (
    <ChordSheetPage
      chords={chords}
      sections={chordSections}
      currentSectionIndex={currentSectionIndex}
      onAdvanceSection={handleAdvance}
      onRetreatSection={handleRetreat}
      structure={structure}
      progression={progression}
      transposedKey={transposedKey}
      originalKey={currentSong?.tonalidad || ""}
      transpose={effectiveTranspose}
      liveTransposeOffset={liveTransposeOffset}
      onLiveTransposeChange={setLiveTransposeOffset}
      bpm={currentSong?.bpm}
      duracion={currentSong?.duracion}
      afinacion={currentSong?.afinacion}
      fontSizeClass={FONT_SIZES[fontSizeIdx]}
      showDetails={showDetails}
      onToggleDetails={() => setShowDetails((v) => !v)}
      glareMode={glareMode}
      teleprompterMode={teleprompterMode}
      onToggleTeleprompterMode={() =>
      setTeleprompterMode((m) =>
        m === "scroll" ? "sections" : "scroll",
      )
      }
      isTeleprompterPlaying={isTeleprompterPlaying}
      onToggleTeleprompterPlay={() => setIsTeleprompterPlaying((p) => !p)}
      teleprompterSpeed={teleprompterSpeed}
      onChangeTeleprompterSpeed={setTeleprompterSpeed}
      onResetTeleprompterScroll={() => {
      if (teleprompterScrollRef.current) {
        teleprompterScrollRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
      }}
      teleprompterScrollRef={teleprompterScrollRef}
    />
  )}
      </div>
    </>
  );
}
