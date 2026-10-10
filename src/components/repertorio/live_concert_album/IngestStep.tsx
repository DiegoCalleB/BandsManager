/**
 * Paso 1: ingesta del concierto (YouTube o archivo), opciones de IA y lanzamiento del análisis.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Lock, Radio, RefreshCw, Scissors, ShieldCheck } from "lucide-react";
import { Button, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Paso 1: ingesta del concierto (YouTube o archivo), opciones de IA y lanzamiento del análisis.
 * @returns Sección de interfaz.
 */
export function IngestStep() {
  const { setCookieModalOpen, hasYoutubeCookies, youtubeUrl, setYoutubeUrl, setUploadedFile, useAi, setUseAi, handleAnalyzeConcert, isAnalyzing, uploadedFile, transcribeFirst, setTranscribeFirst, analysisStatus } = useLiveConcertAlbum();
  return (
    <>
      <div
        className={`p-5 rounded-[var(--r-m)] space-y-4 ${"bg-[var(--sunken)]"}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--acc)] flex items-center gap-2">
            <Radio className="w-4 h-4" /> 1. Ingesta del concierto
            (YouTube o archivo local)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--ink-2)]">
                Enlace de YouTube del concierto completo
              </label>
              <button
                type="button"
                onClick={() => setCookieModalOpen(true)}
                className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                  hasYoutubeCookies
                    ? "text-[var(--ok)] hover:text-[var(--ink-2)]"
                    : "text-[var(--acc)] hover:text-[var(--acc)]/70 hover:underline"
                }`}
                title="Configura las cookies del canal de la banda para permitir descargas directas en servidor"
              >
                {hasYoutubeCookies ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[var(--ok)]" />
                    <span>Canal vinculado</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>¿Es tu canal? Vincular sesión</span>
                  </>
                )}
              </button>
            </div>
            <Input
              size="sm"
              type="text"
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
              O subir archivo de vídeo/audio local
            </label>
            <input aria-label="O subir archivo de vídeo/audio local"
              type="file"
              accept="video/*,audio/*"
              onChange={(e) =>
                setUploadedFile(e.target.files?.[0] || null)
              }
              className={`w-full text-xs text-[var(--ink-2)] file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--r-s)] file:border-0 file:text-xs file:font-semibold file:bg-[var(--acc)] file:text-[var(--ink)] hover:file:bg-[var(--acc)]/80 ${"bg-[var(--surface)]"}`}
            />
          </div>
        </div>

        {/* AI Toggle Option */}
        <div className="pt-2  space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="w-4 h-4 text-[var(--acc)] rounded focus:ring-[var(--acc)] bg-[var(--surface)]"
              />
              <div>
                <span className="text-xs font-bold text-[var(--acc)] flex items-center gap-1.5">
                  {" "}
                  Usar Gemini 1.5 Flash para Análisis Acústico y
                  Transcripción
                </span>
                <p className="text-xs text-[var(--ink-2)]">
                  Desactivado = MODO ALGORÍTMICO LOCAL (Zero Cost).
                  Activado = Enriquecimiento IA para nombres y speeches.
                </p>
              </div>
            </label>

            <Button
              variant="primary"
              onClick={handleAnalyzeConcert}
              disabled={isAnalyzing || (!youtubeUrl && !uploadedFile)}
              className="items-center justify-center gap-2 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                  Analizando…
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" /> <ShowIcon inline emoji="🔍" />Analizar concierto &
                  detectar pistas
                </>
              )}
            </Button>
          </div>

          {useAi && (
            <div className="pl-7 pt-1.5 ml-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transcribeFirst}
                  onChange={(e) => setTranscribeFirst(e.target.checked)}
                  className="w-4 h-4 text-[var(--ok)] rounded focus:ring-[var(--ok)] bg-[var(--surface)] mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-[var(--ok)] flex items-center gap-1.5">
                    {" "}
                    <ShowIcon inline emoji="🎤" />Transcribir audio completo ANTES de trocear (Ajuste
                    fino de cortes por habla/letra)
                  </span>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5">
                    <strong>¿Por qué trocea mejor?</strong> Al transcribir
                    primero el concierto completo, Gemini identifica
                    exactamente dónde termina el cantante de hablar al
                    público y dónde empieza cada letra de canción,
                    ajustando los timestamps de corte para no dejar frases
                    ni acordes cortados.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-xs text-[var(--ink)] flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{analysisStatus}</span>
          </div>
        )}
      </div>
    </>
  );
}
