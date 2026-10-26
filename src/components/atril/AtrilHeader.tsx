/**
 * Cabecera del Atril: título, tonalidad, ficha del tema y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Edit3,Guitar,MessageSquare,Music,Pause,Play,Printer,Theater,Timer,Upload,UserCheck,Wand2 } from "lucide-react";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { ActionMenu,Button } from "../ui";
import { AtrilTabs } from "./AtrilTabs";
import { useAtril } from "./AtrilContext";

/**
 * Cabecera del Atril: título, tonalidad, ficha del tema y acciones.
 * @returns Sección de interfaz.
 */
export function AtrilHeader() {
  const { handleToggleAudio, isPlayingAudio, audioUrl, song, handleGenerateWithAi, isGeneratingAi, analisisAcordes, isAnalyzingChords, setShowAnalisisAcordes, handleAnalyzeChordsFromAudio, setShowStructureUploadModal, setShowShareModal, setShowMetronomeModal, setShowTunerModal, setActiveTab, esMovil, modoEscenario, setModoEscenario } = useAtril();
  return (
    <>
      <div className="bg-[var(--sunken)] p-3 sm:p-4 pr-24 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* INTERACTIVE PLAY / PAUSE BUTTON */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`p-2 sm:p-2.5 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center shrink-0 ${
              isPlayingAudio
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : audioUrl
                  ? "bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)]"
                  : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
            title={
              isPlayingAudio
                ? "Pausar audio de la canción"
                : audioUrl
                  ? "Reproducir audio de la canción (Escuchar mientras lees el cifrado)"
                  : "Esta canción no tiene archivo de audio adjunto en Repertorio"
            }
          >
            {isPlayingAudio ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current pl-0.5" />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-bold truncate text-[var(--ink)] leading-tight">
                {formatSongTitle(song.titulo)}
              </h2>
              {song.esVersionCovers && (
                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--tentative)] text-[var(--on-tentative)]">
                  Cover
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
              {[song.tonalidad || "Mim", `${song.bpm || 120} BPM`, song.afinacion, song.duracion].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {!modoEscenario && <AtrilTabs />}

        <div className="flex items-center gap-1.5 absolute top-3 right-14 z-20 sm:static">
          {/* AI Generate — la acción principal en pantalla ancha; en móvil vive en ⋯ para dejar sitio al cifrado */}
          <Button
            variant="primary"
            size="xs"
            type="button"
            onClick={handleGenerateWithAi}
            disabled={isGeneratingAi}
            className="hidden sm:inline-flex items-center gap-1.5"
            title={
              song.audioPrincipalUrl
                ? "Transcribir la letra de la voz con tiempos y sincronizarla con los acordes (reconocimiento de voz; nunca se inventa a partir del título)"
                : "Necesita el audio de la canción: sin audio no se puede transcribir nada"
            }
          >
            <Wand2
              className={`w-4 h-4 text-[var(--acc-ink)] ${isGeneratingAi ? "animate-spin" : ""}`}
            />
            <span>{isGeneratingAi ? "Escuchando…" : "Transcribir letra"}</span>
          </Button>

          {/* Detección propia de acordes con tiempos, sin IA generativa */}
          {audioUrl && (
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={analisisAcordes && !isAnalyzingChords ? () => setShowAnalisisAcordes((v) => !v) : () => handleAnalyzeChordsFromAudio()}
              disabled={isAnalyzingChords}
              className="hidden sm:inline-flex items-center gap-1.5"
              title={
                analisisAcordes
                  ? "Jamify: ver los acordes detectados en el audio"
                  : "Detectar los acordes del audio con sus tiempos (automático, sin IA generativa)"
              }
            >
              <Music className="w-4 h-4" />
              <span>{isAnalyzingChords ? "Analizando..." : "Acordes del audio"}</span>
            </Button>
          )}

          {/* Acciones secundarias detrás de ⋯ */}
          <ActionMenu
            label="Más acciones de la canción"
            items={[
              { label: isGeneratingAi ? "Escuchando…" : "Transcribir letra", icon: Wand2, onSelect: handleGenerateWithAi, hidden: !esMovil },
              { label: isAnalyzingChords ? "Analizando..." : "Acordes del audio", icon: Music, onSelect: analisisAcordes && !isAnalyzingChords ? () => setShowAnalisisAcordes((v) => !v) : () => handleAnalyzeChordsFromAudio(), hidden: !esMovil || !audioUrl },
              { label: "Subir PDF, imagen o Word con acordes", icon: Upload, onSelect: () => setShowStructureUploadModal(true) },
              { label: "Compartir por WhatsApp o app", icon: MessageSquare, onSelect: () => setShowShareModal(true) },
              { label: "Metrónomo", icon: Timer, onSelect: () => setShowMetronomeModal(true) },
              { label: "Afinador", icon: Guitar, onSelect: () => setShowTunerModal(true) },
              { label: modoEscenario ? "Salir del modo escenario" : "Modo escenario (letra grande)", icon: Theater, onSelect: () => setModoEscenario((v) => !v) },
              { label: "Imprimir cifrado", icon: Printer, onSelect: () => window.print() },
              { label: "Ficha de sustituto urgente", icon: UserCheck, onSelect: () => setActiveTab("substitute") },
              { label: "Editar cifrado", icon: Edit3, onSelect: () => setActiveTab("edit") },
            ]}
          />
        </div>
      </div>
    </>
  );
}
