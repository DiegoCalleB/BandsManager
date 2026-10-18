/**
 * Barra de herramientas del editor de cortes: deshacer/rehacer, CUEs, clasificación, transcripción y fusión.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { GitMerge, Layers, Music2, Plus, Redo2, Sparkles, Tag, Target, Undo2, Wand2 } from "lucide-react";
import { Button, Input } from "../../ui";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Barra de herramientas del editor de cortes: deshacer/rehacer, CUEs, clasificación, transcripción y fusión.
 * @returns Sección de interfaz.
 */
export function EditorToolbar() {
  const { tracks, handleUndo, history, handleRedo, redoStack, albumTitle, setAlbumTitle, setShowQuickNamingModal, handleAutoDetectCues, isDetectingCues, handleSnapAllTracksToCues, handleAutoClassifyTracks, isClassifying, isTranscribingAll, handleTranscribeAllConcert, transcribeAllProgress, selectedIndices, setExpandAllChords, expandAllChords, handleMergeSelectedTracks, handleAddCutTrack } = useLiveConcertAlbum();
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[var(--surface)]/60 p-3.5 rounded-[var(--r-m)]">
        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--acc)]" />
            2. Tracklist Detectado ({tracks.length} Pistas)
          </h3>
          <p className="text-xs text-[var(--ink-2)]">
            Escucha cada trozo, ajusta títulos y momentos de corte, y
            clasifica o fusiona canciones y habla.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Undo & Redo Controls */}
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-s)]">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-ui ${
                history.length > 0
                  ? "bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 cursor-pointer"
                  : "text-[var(--ink-2)] cursor-not-allowed opacity-50"
              }`}
              title="Deshacer última acción (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Deshacer</span>
              {history.length > 0 && (
                <span className="text-micro bg-[var(--acc)]/30 text-[var(--ink)] px-1 rounded font-sans">
                  {history.length}
                </span>
              )}
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-ui ${
                redoStack.length > 0
                  ? "bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 cursor-pointer"
                  : "text-[var(--ink-2)] cursor-not-allowed opacity-50"
              }`}
              title="Rehacer acción cancelada (ctrl+Y / ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Rehacer</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <label className="text-xs font-semibold text-[var(--ink-2)]">
              Título Disco:
            </label>
            <Input size="sm" aria-label="Título disco"
              type="text"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="xs"
            onClick={() => setShowQuickNamingModal(true)}
            className="items-center gap-1.5"
            title="Abrir asistente para nombrar todos los temas y speeches rápidamente o pegar tu setlist"
          >
            <Tag className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            <span>Nombrar temas y speeches</span>
          </Button>

          <Button
            variant="primary"
            size="xs"
            onClick={handleAutoDetectCues}
            disabled={isDetectingCues || tracks.length === 0}
            className="items-center gap-1.5"
            title="Analiza la envolvente de audio para detectar con precisión el ataque musical de cada tema, descartando ruidos, charla o aplausos"
          >
            <Target
              className={`w-3.5 h-3.5 text-[var(--ink-2)] ${isDetectingCues ? "animate-spin" : ""}`}
            />
            <span>
              {isDetectingCues
                ? "Detectando CUEs..."
                : "Autodetectar CUEs de Inicio"}
            </span>
          </Button>

          {tracks.some(
            (t) =>
              t.type === "musica" &&
              typeof t.cueIn === "number" &&
              t.cueIn > 0.2,
          ) && (
            <Button
              variant="primary"
              size="xs"
              onClick={handleSnapAllTracksToCues}
              className="items-center gap-1.5"
              title="Ajusta automáticamente los tiempos de inicio de todos los temas musicales al punto CUE exacto de entrada musical"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Ajustar Inicios a CUEs</span>
            </Button>
          )}

          <button
            onClick={handleAutoClassifyTracks}
            disabled={isClassifying || isTranscribingAll}
            className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-pill)] bg-[var(--tentative)] text-[var(--on-tentative)] hover:bg-[var(--tentative)]/80 flex items-center gap-1.5 transition-ui"
            title="Identificar automáticamente si cada trozo es una canción o un discurso"
          >
            <Wand2
              className={`w-3.5 h-3.5 text-[var(--tentative)] ${isClassifying ? "animate-spin" : ""}`}
            />
            {isClassifying
              ? "Clasificando..."
              : "Auto-Clasificar (Música/Diálogo)"}
          </button>

          <Button
            variant="neutral"
            size="xs"
            onClick={handleTranscribeAllConcert}
            disabled={isTranscribingAll || tracks.length === 0}
            className="items-center gap-1.5"
            title="Transcribir automáticamente todo el concierto (letras, acordes y speeches) usando Gemini IA"
          >
            <Sparkles
              className={`w-3.5 h-3.5 text-[var(--ok)] ${isTranscribingAll ? "animate-spin" : ""}`}
            />
            {isTranscribingAll
              ? `Transcribiendo (${transcribeAllProgress?.current}/${transcribeAllProgress?.total})...`
              : selectedIndices.length > 0
                ? `🎤 Transcribir Seleccionadas (${selectedIndices.length})`
                : "Transcribir Todo el Concierto"}
          </Button>

          <Button
            variant="primary"
            size="xs"
            onClick={() => setExpandAllChords(!expandAllChords)}
            className="items-center gap-1.5"
            title="Mostrar u ocultar los editores de cifrado y letras de todas las canciones"
          >
            <Music2 className="w-3.5 h-3.5 text-[var(--acc)]" />
            {expandAllChords
              ? "Plegar Cifrados"
              : "Desplegar Todos los Cifrados"}
          </Button>

          {selectedIndices.length >= 2 && (
            <Button
              variant="primary"
              size="xs"
              onClick={handleMergeSelectedTracks}
              className="items-center gap-1.5"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Fusionar Seleccionadas ({selectedIndices.length})
            </Button>
          )}

          <button
            onClick={() => handleAddCutTrack(tracks.length)}
            className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir corte
          </button>
        </div>
      </div>
    </>
  );
}
