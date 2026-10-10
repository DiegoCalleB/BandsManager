/**
 * Cabecera del Atril: título, tonalidad, ficha del tema y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Guitar,MessageSquare,Music,Pause,Play,Printer,Timer,Upload,Wand2 } from "lucide-react";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { Button,IconButton } from "../ui";
import { useAtril } from "./AtrilContext";

/**
 * Cabecera del Atril: título, tonalidad, ficha del tema y acciones.
 * @returns Sección de interfaz.
 */
export function AtrilHeader() {
  const { handleToggleAudio, isPlayingAudio, audioUrl, song, handleGenerateWithAi, isGeneratingAi, analisisAcordes, isAnalyzingChords, setShowAnalisisAcordes, handleAnalyzeChordsFromAudio, setShowStructureUploadModal, setShowShareModal, setShowMetronomeModal, setShowTunerModal } = useAtril();
  return (
    <>
      <div className="bg-[var(--sunken)] p-4 pr-24 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* INTERACTIVE PLAY / PAUSE BUTTON */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`p-2.5 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center shrink-0 ${
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
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current pl-0.5" />
            )}
          </button>
          <div>
            <p className="text-micro font-sans text-[var(--ink-2)]">
              <strong className="text-[var(--acc)]">Jamify</strong> · Toca sobre los acordes
            </p>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--ink)]">
                {formatSongTitle(song.titulo)}
              </h2>
              {song.esVersionCovers && (
                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--tentative)] text-[var(--on-tentative)]">
                  Cover
                </span>
              )}
              {isPlayingAudio && (
                <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-full bg-[var(--ok)] text-[var(--on-ok)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                  En reproducción
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] font-sans mt-0.5">
              <span>
                Tonalidad:{" "}
                <strong className="text-[var(--acc)]">
                  {song.tonalidad || "Mim"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Tempo:{" "}
                <strong className="text-[var(--ok)]">
                  {song.bpm || 120} BPM
                </strong>
              </span>
              {song.afinacion && (
                <>
                  <span>•</span>
                  <span>
                    Afinación:{" "}
                    <strong className="text-[var(--tentative)]/80">
                      {song.afinacion}
                    </strong>
                  </span>
                </>
              )}
              {song.duracion && (
                <>
                  <span>•</span>
                  <span>
                    Duración:{" "}
                    <strong className="text-[var(--ink-2)]">
                      {song.duracion}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* AI Generate — the main action, keeps its label */}
          <Button
            variant="primary"
            size="xs"
            type="button"
            onClick={handleGenerateWithAi}
            disabled={isGeneratingAi}
            className="items-center gap-1.5"
            title={
              song.audioPrincipalUrl
                ? "Transcribir la letra de la voz con tiempos y sincronizarla con los acordes (reconocimiento de voz; nunca se inventa a partir del título)"
                : "Necesita el audio de la canción: sin audio no se puede transcribir nada"
            }
          >
            <Wand2
              className={`w-4 h-4 text-[var(--acc-ink)] ${isGeneratingAi ? "animate-spin" : ""}`}
            />
            <span>{isGeneratingAi ? "Escuchando…" : "Letra del audio"}</span>
          </Button>

          {/* Detección propia de acordes con tiempos, sin IA generativa */}
          {audioUrl && (
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={analisisAcordes && !isAnalyzingChords ? () => setShowAnalisisAcordes((v) => !v) : () => handleAnalyzeChordsFromAudio()}
              disabled={isAnalyzingChords}
              className="items-center gap-1.5"
              title={
                analisisAcordes
                  ? "Ver los acordes detectados en el audio"
                  : "Detectar los acordes del audio con sus tiempos (automático, sin IA generativa)"
              }
            >
              <Music className="w-4 h-4" />
              <span>{isAnalyzingChords ? "Analizando..." : "Acordes del audio"}</span>
            </Button>
          )}

          {/* Secondary actions — icon-only to keep the header clean */}
          <IconButton
            label="Subir PDF, imagen o Word con acordes - IA extrae automáticamente"
            type="button"
            onClick={() => setShowStructureUploadModal(true)}
          >
            <Upload className="w-4 h-4" />
          </IconButton>

          <IconButton
            label="Compartir canción y acordes por WhatsApp o App"
            type="button"
            onClick={() => setShowShareModal(true)}
          >
            <MessageSquare className="w-4 h-4" />
          </IconButton>

          <IconButton
            label="Metrónomo"
            type="button"
            onClick={() => setShowMetronomeModal(true)}
          >
            <Timer className="w-4 h-4" />
          </IconButton>

          <IconButton
            label="Afinador"
            type="button"
            onClick={() => setShowTunerModal(true)}
          >
            <Guitar className="w-4 h-4" />
          </IconButton>

          <IconButton
            label="Imprimir cifrado"
            type="button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </>
  );
}
