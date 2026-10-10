/**
 * Reproductor del avance de audio de la banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Headphones,Pause,Play } from "lucide-react";
import { useFansLanding } from "./FansLandingContext";

/**
 * Reproductor del avance de audio de la banda.
 * @returns Sección de interfaz.
 */
export function AudioPreviewPlayer() {
  const { audioPreviewConfig, toggleAudioPreview, isPlayingAudioPreview, t, bandName } = useFansLanding();
  return (
    <>
{/* REPRODUCTOR AUDIO PREVIEW DIRECTO (Single / Adelanto) */}
        {audioPreviewConfig?.habilitado !== false &&
          Boolean(audioPreviewConfig?.audioUrl?.trim()) && (
            <div className="p-3 rounded-[var(--r-l)] bg-[var(--sunken)]  flex items-center justify-between gap-3 text-left">
              <button
                type="button"
                onClick={toggleAudioPreview}
                aria-label={
                  isPlayingAudioPreview
                    ? t("audioPreviewPause") || "Pausar audio"
                    : t("audioPreviewPlay") || "Reproducir audio"
                }
                className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] flex items-center justify-center shrink-0 transition-ui active:scale-[0.97]"
              >
                {isPlayingAudioPreview ? (
                  <Pause className="w-5 h-5 fill-bg-[var(--surface)]" />
                ) : (
                  <Play className="w-5 h-5 fill-bg-[var(--surface)] translate-x-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] truncate">
                  <Headphones className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  <span className="truncate">
                    {audioPreviewConfig?.tituloTema?.trim() ||
                      `${bandName} · Directo Preview`}
                  </span>
                </div>
                <p className="text-micro text-[var(--ink-2)] font-sans truncate">
                  {isPlayingAudioPreview
                    ? t("audioPreviewPlaying") || "Sonando adelanto en vivo..."
                    : audioPreviewConfig?.subtitulo?.trim() ||
                      t("audioPreviewPrompt") ||
                      "Dale al play para escuchar cómo sonamos"}
                </p>
              </div>

              {/* Animación de ondas de audio */}
              <div className="flex items-center gap-1 h-5 shrink-0 px-2">
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-5" : "h-1.5"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-3" : "h-2"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-4" : "h-1"}`}
                />
                <span
                  className={`w-1 bg-[var(--acc)] rounded-[var(--r-pill)] transition-ui duration-300 ${isPlayingAudioPreview ? "h-2" : "h-2.5"}`}
                />
              </div>
            </div>
          )}
    </>
  );
}
